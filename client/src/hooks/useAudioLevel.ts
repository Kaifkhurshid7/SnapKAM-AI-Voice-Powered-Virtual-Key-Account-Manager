import { useEffect, useState } from 'react';
import { startAudioLevelMeter } from '../lib/audio-level';

/**
 * Live microphone loudness (0 to 1) while `active` is true, otherwise 0.
 * If the microphone cannot be opened the level stays at 0 and the UI falls back to a
 * simulated animation.
 */
export function useAudioLevel(active: boolean): number {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let stop: (() => void) | undefined;

    startAudioLevelMeter((value) => {
      if (!cancelled) setLevel(value);
    })
      .then((meter) => {
        if (cancelled) meter.stop();
        else stop = meter.stop;
      })
      .catch(() => {
        /* no microphone access for the meter: the visualiser degrades gracefully */
      });

    return () => {
      cancelled = true;
      stop?.();
    };
  }, [active]);

  return active ? level : 0;
}
