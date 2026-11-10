import { useCallback, useEffect, useRef, useState } from 'react';
import { sendChat } from '../lib/api';
import type {
  ApiMessage,
  ChatRole,
  ConversationPhase,
  ConversationSummary,
  EngineName,
  Language,
} from '../types/api';
import { useSpeechRecognition } from './useSpeechRecognition';
import { useSpeechSynthesis } from './useSpeechSynthesis';

/**
 * Lifecycle of a call:
 * - idle: no call yet
 * - connecting / thinking: waiting for the bot's reply
 * - speaking: the bot is talking
 * - listening: the seller's microphone is open
 * - waiting: call is active but nothing is happening (needs a tap or typed message)
 * - ended: call finished (summary delivered or seller hung up)
 */
export type CallStatus =
  'idle' | 'connecting' | 'thinking' | 'speaking' | 'listening' | 'waiting' | 'ended';

export interface TranscriptMessage {
  id: number;
  role: ChatRole;
  content: string;
  /** Epoch milliseconds when the message was added. */
  at: number;
}

/** How many times to silently re-open the mic after silence before asking the seller to tap. */
const MAX_SILENCE_RETRIES = 2;

export interface UseCall {
  status: CallStatus;
  messages: TranscriptMessage[];
  summary: ConversationSummary | null;
  phase: ConversationPhase | null;
  engine: EngineName | null;
  error: string | null;
  /** Live transcript of what the seller is saying right now. */
  interim: string;
  micSupported: boolean;
  /** True while the seller's microphone is muted (the bot never opens it). */
  muted: boolean;
  /** True while the closing summary is being prepared after a hang-up. */
  summarizing: boolean;
  startedAt: number | null;
  endedAt: number | null;
  start: () => void;
  end: () => void;
  reset: () => void;
  toggleMic: () => void;
  toggleMute: () => void;
  sendText: (text: string) => void;
  retry: () => void;
}

/**
 * Orchestrates the voice conversation loop:
 *   bot replies (API) -> bot speaks (TTS) -> mic opens (STT) -> seller speaks -> repeat
 * until the bot delivers the summary or the seller ends the call.
 */
export function useCall(language: Language): UseCall {
  const [status, setStatus] = useState<CallStatus>('idle');
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [summary, setSummary] = useState<ConversationSummary | null>(null);
  const [phase, setPhase] = useState<ConversationPhase | null>(null);
  const [engine, setEngine] = useState<EngineName | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [endedAt, setEndedAt] = useState<number | null>(null);

  const recognition = useSpeechRecognition(language);
  const synthesis = useSpeechSynthesis(language);

  // Mutable call state read from async continuations, where React state would be stale.
  const messagesRef = useRef<TranscriptMessage[]>([]);
  const nextIdRef = useRef(1);
  /** Incremented on start/end/reset so in-flight async work from an old call is discarded. */
  const sessionRef = useRef(0);
  const mutedRef = useRef(false);

  const addMessage = useCallback((role: ChatRole, content: string) => {
    const message: TranscriptMessage = {
      id: nextIdRef.current++,
      role,
      content,
      at: Date.now(),
    };
    messagesRef.current = [...messagesRef.current, message];
    setMessages(messagesRef.current);
  }, []);

  const isCurrent = (session: number) => sessionRef.current === session;

  /** Open the mic for one utterance; on a final transcript, hand it to the bot. */
  async function listenForSeller(session: number, retries = 0): Promise<void> {
    if (!isCurrent(session)) return;
    if (mutedRef.current) {
      setStatus('waiting');
      return;
    }
    setStatus('listening');
    setError(null);

    try {
      const result = await recognition.listen();
      if (!isCurrent(session)) return;

      if (result.kind === 'final') {
        await handleSellerUtterance(session, result.text);
      } else if (result.kind === 'silence') {
        if (retries < MAX_SILENCE_RETRIES) await listenForSeller(session, retries + 1);
        else setStatus('waiting');
      } else {
        setStatus('waiting');
      }
    } catch (err) {
      if (!isCurrent(session)) return;
      setError(err instanceof Error ? err.message : 'Could not use the microphone.');
      setStatus('waiting');
    }
  }

  async function handleSellerUtterance(session: number, text: string): Promise<void> {
    addMessage('user', text);
    await takeBotTurn(session);
  }

  /** Fetch the bot's next turn, speak it, then either finish the call or listen again. */
  async function takeBotTurn(session: number): Promise<void> {
    setStatus(messagesRef.current.length === 0 ? 'connecting' : 'thinking');
    setError(null);

    const apiMessages: ApiMessage[] = messagesRef.current.map(({ role, content }) => ({
      role,
      content,
    }));

    let response;
    try {
      response = await sendChat(apiMessages, language);
    } catch (err) {
      if (!isCurrent(session)) return;
      setError(err instanceof Error ? err.message : 'Could not reach the assistant.');
      setStatus('waiting');
      return;
    }
    if (!isCurrent(session)) return;

    addMessage('assistant', response.reply);
    setEngine(response.engine);
    setPhase(response.phase);
    if (response.summary) setSummary(response.summary);

    setStatus('speaking');
    await synthesis.speak(response.reply);
    if (!isCurrent(session)) return;

    if (response.phase === 'summary') {
      setEndedAt(Date.now());
      setStatus('ended');
      return;
    }
    await listenForSeller(session);
  }

  const start = () => {
    synthesis.cancel();
    recognition.abort();
    sessionRef.current += 1;
    messagesRef.current = [];
    setMessages([]);
    setSummary(null);
    setPhase(null);
    setError(null);
    setSummarizing(false);
    setStartedAt(Date.now());
    setEndedAt(null);
    void takeBotTurn(sessionRef.current);
  };

  /** Fetch the closing summary after the seller hangs up mid-conversation. */
  async function requestSummary(session: number): Promise<void> {
    setSummarizing(true);
    try {
      const apiMessages: ApiMessage[] = messagesRef.current.map(({ role, content }) => ({
        role,
        content,
      }));
      const response = await sendChat(apiMessages, language, { endCall: true });
      if (!isCurrent(session)) return;
      setEngine(response.engine);
      setPhase(response.phase);
      if (response.summary) setSummary(response.summary);
    } catch (err) {
      if (!isCurrent(session)) return;
      setError(err instanceof Error ? err.message : 'Could not prepare the call summary.');
    } finally {
      if (isCurrent(session)) setSummarizing(false);
    }
  }

  const end = () => {
    const needsSummary = messagesRef.current.length > 0 && !summary;
    sessionRef.current += 1;
    synthesis.cancel();
    recognition.abort();
    setError(null);
    setEndedAt(Date.now());
    setStatus('ended');
    if (needsSummary) void requestSummary(sessionRef.current);
  };

  const reset = () => {
    sessionRef.current += 1;
    synthesis.cancel();
    recognition.abort();
    messagesRef.current = [];
    setMessages([]);
    setSummary(null);
    setPhase(null);
    setEngine(null);
    setError(null);
    setSummarizing(false);
    setStartedAt(null);
    setEndedAt(null);
    setStatus('idle');
  };

  /**
   * Context-sensitive mic control:
   * - while the bot speaks, interrupt it (the loop then opens the mic automatically)
   * - while listening, stop listening
   * - while waiting, start listening
   */
  const toggleMic = () => {
    if (status === 'speaking') {
      synthesis.cancel();
    } else if (status === 'listening') {
      recognition.abort();
    } else if (status === 'waiting') {
      // Tapping the orb while muted implies the seller wants to speak, so unmute first.
      mutedRef.current = false;
      setMuted(false);
      void listenForSeller(sessionRef.current);
    }
  };

  /** Mute or unmute the seller's microphone without ending the call. */
  const toggleMute = () => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    if (next && status === 'listening') recognition.abort();
    if (!next && status === 'waiting') void listenForSeller(sessionRef.current);
  };

  /** Typed fallback for browsers without speech recognition or when the mic is unavailable. */
  const sendText = (text: string) => {
    const trimmed = text.trim();
    const canSend = status === 'listening' || status === 'speaking' || status === 'waiting';
    if (!trimmed || !canSend) return;
    sessionRef.current += 1;
    synthesis.cancel();
    recognition.abort();
    void handleSellerUtterance(sessionRef.current, trimmed);
  };

  const retry = () => {
    sessionRef.current += 1;
    void takeBotTurn(sessionRef.current);
  };

  // Hang up and release audio resources when leaving the page.
  useEffect(() => {
    return () => {
      sessionRef.current += 1;
    };
  }, []);

  return {
    status,
    messages,
    summary,
    phase,
    engine,
    error,
    interim: recognition.interim,
    micSupported: recognition.supported,
    muted,
    summarizing,
    startedAt,
    endedAt,
    start,
    end,
    reset,
    toggleMic,
    toggleMute,
    sendText,
    retry,
  };
}
