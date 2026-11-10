import { useCallback, useEffect, useRef, useState } from 'react';
import { splitIntoChunks, toSpeakable } from '../lib/speech-text';
import type { Language } from '../types/api';

export interface UseSpeechSynthesis {
  supported: boolean;
  speaking: boolean;
  /** Speak text aloud. Resolves when speech finishes or is cancelled. */
  speak: (text: string) => Promise<void>;
  cancel: () => void;
}

/**
 * Choose the best available voice for a language: exact locale match first, then the same
 * base language, preferring higher-quality network voices over robotic local ones.
 */
function pickVoice(
  voices: SpeechSynthesisVoice[],
  language: Language,
): SpeechSynthesisVoice | null {
  const base = language.split('-')[0] ?? language;
  const byQuality = (a: SpeechSynthesisVoice, b: SpeechSynthesisVoice) =>
    Number(/google|natural|neural/i.test(b.name)) - Number(/google|natural|neural/i.test(a.name));

  const exact = voices.filter((v) => v.lang.replace('_', '-') === language).sort(byQuality);
  if (exact[0]) return exact[0];
  const sameBase = voices.filter((v) => v.lang.toLowerCase().startsWith(base)).sort(byQuality);
  return sameBase[0] ?? null;
}

/** Promise-based wrapper over the browser's speech synthesis (text-to-speech). */
export function useSpeechSynthesis(language: Language): UseSpeechSynthesis {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [speaking, setSpeaking] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const resolvePendingRef = useRef<(() => void) | null>(null);

  // Voices load asynchronously in most browsers, so refresh the list when they change.
  useEffect(() => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    const refresh = () => {
      voicesRef.current = synth.getVoices();
    };
    refresh();
    synth.addEventListener('voiceschanged', refresh);
    return () => synth.removeEventListener('voiceschanged', refresh);
  }, [supported]);

  const cancel = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    // Queued utterances may be dropped without firing events, so resolve explicitly.
    resolvePendingRef.current?.();
    resolvePendingRef.current = null;
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback(
    (text: string): Promise<void> => {
      if (!supported) return Promise.resolve();
      cancel();

      const chunks = splitIntoChunks(toSpeakable(text));
      if (chunks.length === 0) return Promise.resolve();

      const voice = pickVoice(voicesRef.current, language);

      return new Promise<void>((resolve) => {
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          // Only the current utterance may update state; late events from a cancelled one must not.
          if (resolvePendingRef.current === finish) {
            resolvePendingRef.current = null;
            setSpeaking(false);
          }
          resolve();
        };
        resolvePendingRef.current = finish;

        chunks.forEach((chunk, index) => {
          const utterance = new SpeechSynthesisUtterance(chunk);
          utterance.lang = language;
          if (voice) utterance.voice = voice;
          utterance.rate = 1;
          utterance.pitch = 1;
          if (index === 0) utterance.onstart = () => setSpeaking(true);
          // Resolve on error too, so a failed utterance never hangs the call loop.
          if (index === chunks.length - 1) {
            utterance.onend = finish;
            utterance.onerror = finish;
          }
          window.speechSynthesis.speak(utterance);
        });
      });
    },
    [cancel, language, supported],
  );

  // Stop talking if the component unmounts mid-sentence.
  useEffect(() => () => cancel(), [cancel]);

  return { supported, speaking, speak, cancel };
}
