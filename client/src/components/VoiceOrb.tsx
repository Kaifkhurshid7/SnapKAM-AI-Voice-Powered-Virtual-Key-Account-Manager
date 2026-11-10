import clsx from 'clsx';
import { MicOff, Mic, Phone, Volume2 } from 'lucide-react';
import type { CallStatus } from '../hooks/useCall';

interface VoiceOrbProps {
  status: CallStatus;
  muted: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const ORB_LABEL: Record<CallStatus, string> = {
  idle: 'Start call',
  connecting: 'Connecting',
  thinking: 'Thinking',
  speaking: 'Interrupt and speak',
  listening: 'Stop listening',
  waiting: 'Tap to speak',
  ended: 'Start new call',
};

/** Animated orb whose motion reflects what the call is doing (listening, thinking, speaking). */
export function VoiceOrb({ status, muted, onClick, disabled }: VoiceOrbProps) {
  const listening = status === 'listening';
  const busy = status === 'connecting' || status === 'thinking';
  const resting = status === 'idle' || status === 'ended' || status === 'waiting';

  const Icon =
    status === 'idle' || status === 'ended'
      ? Phone
      : status === 'speaking'
        ? Volume2
        : muted
          ? MicOff
          : Mic;

  return (
    <div className="relative flex h-52 w-52 shrink-0 items-center justify-center sm:h-60 sm:w-60">
      {listening &&
        [0, 0.6, 1.2].map((delay) => (
          <span
            key={delay}
            aria-hidden="true"
            className="animate-orb-ripple absolute inset-8 rounded-full border-2 border-brand"
            style={{ animationDelay: `${delay}s` }}
          />
        ))}

      {busy && (
        <span
          aria-hidden="true"
          className="animate-orb-spin absolute inset-3 rounded-full border-4 border-transparent border-t-brand"
        />
      )}

      <span
        aria-hidden="true"
        className="absolute inset-6 rounded-full bg-brand/15 blur-2xl"
      />

      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={ORB_LABEL[status]}
        className={clsx(
          'relative flex h-36 w-36 items-center justify-center rounded-full text-brand-fg shadow-card transition-transform duration-300 sm:h-40 sm:w-40',
          'bg-[radial-gradient(circle_at_30%_25%,color-mix(in_srgb,var(--brand)_65%,white),var(--brand)_60%,color-mix(in_srgb,var(--brand)_70%,black))]',
          'ring-4 ring-brand/20 enabled:hover:scale-105 enabled:active:scale-95 disabled:cursor-default',
          resting && 'animate-orb-breathe',
          listening && 'scale-105',
          busy && 'opacity-80',
        )}
      >
        <Icon className="h-14 w-14" aria-hidden="true" />
      </button>
    </div>
  );
}
