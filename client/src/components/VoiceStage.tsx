import clsx from 'clsx';
import {
  Keyboard,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  RotateCcw,
  Send,
  Sparkles,
  Timer,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { formatDuration, useElapsedSeconds } from '../hooks/useElapsed';
import type { CallStatus, UseCall } from '../hooks/useCall';
import type { Language } from '../types/api';
import { VoiceOrb } from './VoiceOrb';
import { VoiceVisualizer, type VisualizerMode } from './VoiceVisualizer';

interface VoiceStageProps {
  call: UseCall;
  sellerName: string | null;
  language: Language;
  onLanguageChange: (language: Language) => void;
}

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en-IN', label: 'English' },
  { value: 'hi-IN', label: 'हिन्दी' },
];

const STATUS_COPY: Record<CallStatus, { title: string; hint: string }> = {
  idle: {
    title: 'Talk to your Virtual KAM',
    hint: 'Describe your business concern out loud, like sales dropping or orders getting cancelled.',
  },
  connecting: { title: 'Connecting...', hint: 'Your Key Account Manager is joining the call.' },
  thinking: { title: 'Thinking...', hint: 'Looking at your account numbers.' },
  speaking: { title: 'KAM is speaking', hint: 'Tap the orb to interrupt and reply.' },
  listening: { title: 'Listening...', hint: 'Go ahead, I am listening.' },
  waiting: { title: 'Your turn', hint: 'Tap the orb to speak, or type your reply below.' },
  ended: { title: 'Call ended', hint: 'Your summary is below. Start a new call any time.' },
};

const ENGINE_LABEL = {
  gemini: { text: 'Powered by Gemini', tone: 'bg-brand-soft text-brand' },
  'rule-based': { text: 'Offline demo mode', tone: 'bg-warning-soft text-warning' },
} as const;

function visualizerMode(status: CallStatus): VisualizerMode {
  if (status === 'listening') return 'listening';
  if (status === 'speaking') return 'speaking';
  if (status === 'connecting' || status === 'thinking') return 'busy';
  return 'idle';
}

/** The main call experience: orb, live waveform, captions, call controls and a typed fallback. */
export function VoiceStage({ call, sellerName, language, onLanguageChange }: VoiceStageProps) {
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState('');

  const { status, error, interim, engine, micSupported, muted } = call;
  const inCall = status !== 'idle' && status !== 'ended';
  const copy = STATUS_COPY[status];
  const lastBotMessage = [...call.messages].reverse().find((m) => m.role === 'assistant');
  const elapsed = useElapsedSeconds(call.startedAt, call.endedAt);

  // Show what the seller is saying while listening, otherwise the bot's latest line.
  const caption =
    status === 'listening' && interim
      ? { label: sellerName ?? 'You', text: interim, you: true }
      : lastBotMessage && status !== 'idle'
        ? { label: 'KAM', text: lastBotMessage.content, you: false }
        : null;

  const micLabel = !micSupported
    ? 'Mic unavailable'
    : muted
      ? 'Mic muted'
      : status === 'listening'
        ? 'Mic on'
        : 'Mic ready';

  const orbAction = () => {
    if (status === 'idle' || status === 'ended') call.start();
    else call.toggleMic();
  };

  const submitTyped = (event: FormEvent) => {
    event.preventDefault();
    call.sendText(draft);
    setDraft('');
  };

  return (
    <section
      aria-labelledby="stage-title"
      className="shadow-card flex flex-col items-center rounded-3xl border border-line bg-card px-5 py-6 sm:px-8"
    >
      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Conversation language"
          className="inline-flex rounded-full border border-line bg-card-muted p-1 text-sm"
        >
          {LANGUAGES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              disabled={inCall}
              aria-pressed={language === value}
              onClick={() => onLanguageChange(value)}
              className={clsx(
                'rounded-full px-3.5 py-1 font-medium transition-colors disabled:cursor-not-allowed',
                language === value ? 'bg-brand text-brand-fg' : 'text-muted enabled:hover:text-fg',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {engine && (
            <span
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
                ENGINE_LABEL[engine].tone,
              )}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {ENGINE_LABEL[engine].text}
            </span>
          )}
          {call.startedAt !== null && (
            <span
              className="inline-flex items-center gap-2 rounded-full border border-line bg-card-muted px-3 py-1 text-xs font-semibold tabular-nums"
              aria-label={`Call duration ${formatDuration(elapsed)}`}
            >
              <span
                aria-hidden="true"
                className={clsx(
                  'h-2 w-2 rounded-full',
                  inCall ? 'animate-pulse bg-success' : 'bg-muted',
                )}
              />
              {inCall ? 'Connected' : 'Duration'}
              <Timer className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
              {formatDuration(elapsed)}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 w-full">
        <VoiceVisualizer mode={visualizerMode(status)}>
          <VoiceOrb
            status={status}
            muted={muted}
            onClick={orbAction}
            disabled={status === 'connecting' || status === 'thinking'}
          />
        </VoiceVisualizer>
      </div>

      <div className="text-center" aria-live="polite">
        <h2 id="stage-title" className="text-xl font-semibold tracking-tight sm:text-2xl">
          {copy.title}
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted">{copy.hint}</p>
      </div>

      <div className="mt-4 min-h-24 w-full max-w-xl" aria-live="off">
        {caption && (
          <figure
            key={caption.text}
            className={clsx(
              'animate-fade-up rounded-2xl border px-5 py-4 text-center',
              caption.you ? 'border-brand/40 bg-brand-soft' : 'border-line bg-card-muted',
            )}
          >
            <figcaption className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">
              {caption.label}
            </figcaption>
            <blockquote className="text-base leading-relaxed">{caption.text}</blockquote>
          </figure>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 flex w-full max-w-xl flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/40 bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          <span>{error}</span>
          {status !== 'ended' && (
            <button
              type="button"
              onClick={call.retry}
              className="inline-flex items-center gap-1.5 rounded-lg bg-danger px-3 py-1.5 font-semibold text-surface"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Retry
            </button>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {!inCall ? (
          <button
            type="button"
            onClick={orbAction}
            className="inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3 text-base font-semibold text-brand-fg shadow-card transition hover:brightness-110 active:scale-95"
          >
            <Phone className="h-5 w-5" aria-hidden="true" />
            {status === 'ended' ? 'Start new call' : 'Start call'}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={call.toggleMute}
              aria-pressed={muted}
              disabled={!micSupported}
              className={clsx(
                'inline-flex items-center gap-2 rounded-full border px-5 py-3 font-semibold transition active:scale-95 disabled:opacity-50',
                muted
                  ? 'border-warning bg-warning-soft text-warning'
                  : 'border-line bg-card-muted hover:border-brand',
              )}
            >
              {muted ? (
                <MicOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Mic className="h-5 w-5" aria-hidden="true" />
              )}
              {muted ? 'Unmute' : 'Mute'}
            </button>
            <button
              type="button"
              onClick={() => setTyping((value) => !value)}
              aria-pressed={typing}
              className={clsx(
                'inline-flex items-center gap-2 rounded-full border px-5 py-3 font-semibold transition active:scale-95',
                typing
                  ? 'border-brand bg-brand-soft text-brand'
                  : 'border-line bg-card-muted hover:border-brand',
              )}
            >
              <Keyboard className="h-5 w-5" aria-hidden="true" />
              Type
            </button>
            <button
              type="button"
              onClick={call.end}
              className="inline-flex items-center gap-2 rounded-full bg-danger px-5 py-3 font-semibold text-surface transition hover:brightness-110 active:scale-95"
            >
              <PhoneOff className="h-5 w-5" aria-hidden="true" />
              End call
            </button>
          </>
        )}
      </div>

      {inCall && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted" role="status">
          <span
            aria-hidden="true"
            className={clsx(
              'h-2 w-2 rounded-full',
              !micSupported ? 'bg-danger' : muted ? 'bg-warning' : 'bg-success',
            )}
          />
          {micLabel}
        </p>
      )}

      {inCall && (typing || !micSupported) && (
        <form onSubmit={submitTyped} className="mt-4 flex w-full max-w-xl gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type your reply..."
            aria-label="Type your reply"
            maxLength={500}
            className="min-w-0 flex-1 rounded-full border border-line bg-card-muted px-5 py-3 text-base outline-none placeholder:text-muted focus:border-brand"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Send reply"
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-brand-fg transition enabled:hover:brightness-110 disabled:opacity-40"
          >
            <Send className="h-5 w-5" aria-hidden="true" />
          </button>
        </form>
      )}
    </section>
  );
}
