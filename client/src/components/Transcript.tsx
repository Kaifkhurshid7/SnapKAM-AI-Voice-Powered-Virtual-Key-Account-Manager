import clsx from 'clsx';
import { Bot, MessageSquareText, User } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { CallStatus, TranscriptMessage } from '../hooks/useCall';

interface TranscriptProps {
  messages: TranscriptMessage[];
  sellerName: string | null;
  status: CallStatus;
}

const timeFormat = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' });

/** Animated three-dot indicator shown while the assistant prepares its reply. */
function ThinkingIndicator() {
  return (
    <div className="animate-fade-up flex items-center gap-3" role="status">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-brand-fg">
        <Bot className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-2xl rounded-tl-md bg-card-muted px-4 py-3">
        <span className="sr-only">SnapKAM is thinking</span>
        {[0, 0.15, 0.3].map((delay) => (
          <span
            key={delay}
            aria-hidden="true"
            className="animate-bar-wave h-2 w-2 rounded-full bg-brand"
            style={{ animationDelay: `${delay}s` }}
          />
        ))}
      </span>
    </div>
  );
}

/** Scrollable chat-style log of the conversation, kept in view as new turns arrive. */
export function Transcript({ messages, sellerName, status }: TranscriptProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const live = status !== 'idle' && status !== 'ended';
  const thinking = status === 'thinking' || status === 'connecting';

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, thinking]);

  return (
    <section
      aria-labelledby="transcript-title"
      className="shadow-card flex h-full min-h-96 flex-col rounded-3xl border border-line bg-card"
    >
      <header className="flex items-center justify-between gap-2 border-b border-line px-5 py-4">
        <div className="flex items-center gap-2">
          <MessageSquareText className="h-5 w-5 text-brand" aria-hidden="true" />
          <h2 id="transcript-title" className="font-semibold">
            Live transcript
          </h2>
        </div>
        {live && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-soft px-3 py-1 text-xs font-semibold text-danger">
            <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-danger" />
            Live
          </span>
        )}
      </header>

      <div
        className="flex-1 space-y-4 overflow-y-auto px-5 py-4"
        role="log"
        aria-live="polite"
        aria-label="Conversation transcript"
      >
        {messages.length === 0 && !thinking ? (
          <div className="flex h-full min-h-56 flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand">
              <MessageSquareText className="h-7 w-7" aria-hidden="true" />
            </span>
            <p className="font-medium">No conversation yet</p>
            <p className="text-sm text-muted">
              Press Start call and describe your concern. Every message will appear here as you
              talk.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <div
                key={message.id}
                className={clsx('animate-fade-up flex gap-3', isUser && 'flex-row-reverse')}
              >
                <span
                  className={clsx(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    isUser ? 'bg-card-muted text-fg' : 'bg-brand text-brand-fg',
                  )}
                  aria-hidden="true"
                >
                  {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </span>
                <div className={clsx('max-w-[85%]', isUser && 'text-right')}>
                  <p className="mb-1 flex items-center gap-2 text-xs text-muted">
                    <span className="font-semibold text-fg">
                      {isUser ? (sellerName ?? 'You') : 'SnapKAM'}
                    </span>
                    <time dateTime={new Date(message.at).toISOString()}>
                      {timeFormat.format(message.at)}
                    </time>
                  </p>
                  <p
                    className={clsx(
                      'inline-block rounded-2xl px-4 py-2.5 text-left text-sm leading-relaxed',
                      isUser
                        ? 'rounded-tr-md bg-brand text-brand-fg'
                        : 'rounded-tl-md bg-card-muted',
                    )}
                  >
                    {message.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
        {thinking && <ThinkingIndicator />}
        <div ref={endRef} />
      </div>
    </section>
  );
}
