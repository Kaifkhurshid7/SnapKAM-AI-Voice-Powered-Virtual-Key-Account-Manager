import { useCallback, useEffect, useRef, useState } from 'react';
import type { Language } from '../types/api';

export type ListenResult =
  { kind: 'final'; text: string } | { kind: 'silence' } | { kind: 'aborted' };

/** Thrown when the browser or user denies microphone access. */
export class MicPermissionError extends Error {
  constructor() {
    super('Microphone access was blocked. Allow it in your browser settings to talk to SnapKAM.');
    this.name = 'MicPermissionError';
  }
}

function getRecognitionConstructor(): SpeechRecognitionConstructorLike | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

export interface UseSpeechRecognition {
  /** Whether this browser supports speech recognition at all. */
  supported: boolean;
  listening: boolean;
  /** Live (not yet final) transcript while the seller is speaking. */
  interim: string;
  /** Listen for a single utterance. Resolves when the seller finishes, stays silent, or aborts. */
  listen: () => Promise<ListenResult>;
  abort: () => void;
}

/**
 * Promise-based wrapper over the browser's SpeechRecognition API.
 * A fresh recognizer is created for each utterance, which is more reliable across browsers
 * than reusing one instance.
 */
export function useSpeechRecognition(language: Language): UseSpeechRecognition {
  const Recognition = getRecognitionConstructor();
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const activeRef = useRef<SpeechRecognitionLike | null>(null);

  const listen = useCallback((): Promise<ListenResult> => {
    return new Promise<ListenResult>((resolve, reject) => {
      if (!Recognition) {
        reject(new Error('Speech recognition is not supported in this browser.'));
        return;
      }

      activeRef.current?.abort();
      const recognition = new Recognition();
      activeRef.current = recognition;
      recognition.lang = language;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      let finalText = '';
      let settled = false;

      // Settle exactly once; browsers fire onerror and onend in varying orders.
      const settle = (action: () => void) => {
        if (settled) return;
        settled = true;
        if (activeRef.current === recognition) activeRef.current = null;
        setListening(false);
        setInterim('');
        action();
      };

      recognition.onstart = () => setListening(true);

      recognition.onresult = (event) => {
        let interimText = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          const transcript = result?.[0]?.transcript ?? '';
          if (result?.isFinal) finalText += transcript;
          else interimText += transcript;
        }
        setInterim((finalText + interimText).trim());
      };

      recognition.onerror = (event) => {
        switch (event.error) {
          case 'no-speech':
            settle(() => resolve({ kind: 'silence' }));
            break;
          case 'aborted':
            settle(() => resolve({ kind: 'aborted' }));
            break;
          case 'not-allowed':
          case 'service-not-allowed':
            settle(() => reject(new MicPermissionError()));
            break;
          case 'audio-capture':
            settle(() => reject(new Error('No microphone was found on this device.')));
            break;
          default:
            settle(() => reject(new Error(`Speech recognition error: ${event.error}`)));
        }
      };

      recognition.onend = () => {
        const text = finalText.trim();
        settle(() => resolve(text ? { kind: 'final', text } : { kind: 'silence' }));
      };

      try {
        recognition.start();
      } catch (error) {
        settle(() =>
          reject(error instanceof Error ? error : new Error('Could not start listening.')),
        );
      }
    });
  }, [Recognition, language]);

  const abort = useCallback(() => {
    activeRef.current?.abort();
  }, []);

  // Release the microphone if the component using this hook unmounts mid-recognition.
  useEffect(() => () => activeRef.current?.abort(), []);

  return { supported: Boolean(Recognition), listening, interim, listen, abort };
}
