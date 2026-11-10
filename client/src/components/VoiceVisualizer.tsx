import clsx from 'clsx';
import type { ReactNode } from 'react';
import { useAudioLevel } from '../hooks/useAudioLevel';

export type VisualizerMode = 'idle' | 'listening' | 'speaking' | 'busy';

interface VoiceVisualizerProps {
  mode: VisualizerMode;
  children: ReactNode;
}

const BARS_PER_SIDE = 12;

/** Bell-shaped envelope so bars are tallest next to the orb and taper outwards. */
const ENVELOPE = Array.from({ length: BARS_PER_SIDE }, (_, i) => {
  const t = i / (BARS_PER_SIDE - 1);
  return 0.25 + 0.75 * Math.exp(-3 * t * t);
});

function Bars({
  mode,
  level,
  mirrored,
}: {
  mode: VisualizerMode;
  level: number;
  mirrored: boolean;
}) {
  const order = mirrored ? [...ENVELOPE].reverse() : ENVELOPE;

  return (
    <div
      aria-hidden="true"
      className={clsx(
        'hidden h-20 flex-1 items-center justify-center gap-[3px] sm:flex',
        mirrored ? 'flex-row' : 'flex-row-reverse',
      )}
    >
      {order.map((envelope, index) => {
        // Listening uses the real microphone level; speaking uses a CSS wave; otherwise bars rest.
        const height =
          mode === 'listening' ? 0.08 + level * envelope : mode === 'speaking' ? envelope : 0.08;
        return (
          <span
            key={index}
            className={clsx(
              'w-[3px] origin-center rounded-full bg-brand transition-[height,opacity] duration-100',
              mode === 'speaking' && 'animate-bar-wave',
              mode === 'idle' || mode === 'busy' ? 'opacity-30' : 'opacity-90',
            )}
            style={{
              height: `${height * 100}%`,
              animationDelay: mode === 'speaking' ? `${(index % 6) * 0.11}s` : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

/** Voice orb flanked by a live waveform: real mic level while listening, animated while speaking. */
export function VoiceVisualizer({ mode, children }: VoiceVisualizerProps) {
  const level = useAudioLevel(mode === 'listening');

  return (
    <div className="flex w-full items-center justify-center gap-2">
      <Bars mode={mode} level={level} mirrored={false} />
      {children}
      <Bars mode={mode} level={level} mirrored />
    </div>
  );
}
