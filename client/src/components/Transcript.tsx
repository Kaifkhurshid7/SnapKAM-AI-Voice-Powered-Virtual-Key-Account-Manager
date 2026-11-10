import clsx from 'clsx';
import { Bot, MessageSquareText, User } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { TranscriptMessage } from '../hooks/useCall';

interface TranscriptProps {
  messages: TranscriptMessage[];
  sellerName: string | null;
}

/** Scrollable chat-style log of the conversation, kept in view as new turns arrive. */
export function Transcript({ messages, sellerName }: TranscriptProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  return (
    <section
      aria-labelledby="transcript-title"
      className="shadow-card flex h-full min-h-96 flex-col rounded-3xl border border-line bg-card"
    >
      <header className="flex items-center gap-2 border-b border-line px-5 py-4">
        <MessageSquareText className="h-5 w-5 text-brand" aria-hidden="true" />
        <h2 id="transcript-title" className="font-semibold">
          Live transcript
        </h2>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4" role="log" aria-live="polite">
        {messages.length === 0 ? (
          <p className="pt-10 text-center text-sm text-muted">
            The conversation will appear here once the call starts.
          </p>
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
                  <p className="mb-1 text-xs font-medium text-muted">
                    {isUser ? (sellerName ?? 'You') : 'SnapKAM'}
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
        <div ref={endRef} />
      </div>
    </section>
  );
}
