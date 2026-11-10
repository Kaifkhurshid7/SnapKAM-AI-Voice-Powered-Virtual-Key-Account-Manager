import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { ConversationService } from '../src/services/conversation.service.js';
import { loadSellerData } from '../src/services/seller.service.js';

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const sellerData = await loadSellerData();
  // No API key: exercises the offline rule-based engine, so tests never call an external LLM.
  const conversation = ConversationService.create(
    { GEMINI_API_KEY: undefined, GEMINI_MODEL: 'test-model' },
    sellerData,
  );
  const app = createApp({ conversation, sellerData, corsOrigin: 'http://localhost:5173' });
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

const postChat = (body: unknown) =>
  fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('HTTP API', () => {
  it('reports health', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: 'ok' });
  });

  it('returns seller metrics and diagnosis', async () => {
    const res = await fetch(`${baseUrl}/api/seller`);
    const body = (await res.json()) as { diagnosis: { metrics: unknown[]; insights: unknown[] } };
    expect(res.status).toBe(200);
    expect(body.diagnosis.metrics).toHaveLength(5);
    expect(body.diagnosis.insights.length).toBeGreaterThan(0);
  });

  it('starts a call with a greeting', async () => {
    const res = await postChat({ messages: [], language: 'en-IN' });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toMatchObject({ phase: 'greeting', engine: 'rule-based' });
  });

  it('rejects malformed chat requests', async () => {
    const res = await postChat({ messages: [{ role: 'user', content: '' }] });
    expect(res.status).toBe(400);
  });

  it('returns 404 JSON for unknown API routes', async () => {
    const res = await fetch(`${baseUrl}/api/unknown`);
    expect(res.status).toBe(404);
  });
});
