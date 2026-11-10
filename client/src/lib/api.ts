import type { ApiMessage, ChatResponse, Language, SellerResponse } from '../types/api';

const API_BASE = '/api';

/** Error for non-2xx API responses, carrying the server-provided message when available. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(response.status, body?.error ?? `Request failed (${response.status})`);
  }
  return (await response.json()) as T;
}

export function fetchSeller(signal?: AbortSignal): Promise<SellerResponse> {
  return request<SellerResponse>('/seller', { signal });
}

export interface ChatOptions {
  /** True when the seller hung up: the server returns the final summary. */
  endCall?: boolean;
  signal?: AbortSignal;
}

/** Send the transcript so far (empty to start the call) and get the bot's next turn. */
export function sendChat(
  messages: ApiMessage[],
  language: Language,
  { endCall = false, signal }: ChatOptions = {},
): Promise<ChatResponse> {
  return request<ChatResponse>('/chat', {
    method: 'POST',
    body: JSON.stringify({ messages, language, endCall }),
    signal,
  });
}
