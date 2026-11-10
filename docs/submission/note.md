# SnapKAM: Mini AI Voice KAM (submission note)

**What it is.** A browser-based, voice-first assistant that plays a Snapdeal Virtual Key Account Manager. A seller says "my sales dropped", and the bot listens, asks follow-up questions, finds likely causes in mock account data, recommends three actions and closes with a spoken and on-screen summary.

**Models and voice stack**

| Layer              | Choice                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| LLM                | Google Gemini (`gemini-2.5-flash` by default, configurable) with JSON-schema structured output |
| Speech-to-text     | Browser Web Speech API (`SpeechRecognition`), English (India) and Hindi                        |
| Text-to-speech     | Browser Web Speech API (`speechSynthesis`), best available en-IN or hi-IN voice                |
| Backend / frontend | Node.js, Express and TypeScript / React, Vite and Tailwind CSS                                 |

Browser speech APIs were chosen so the demo needs no extra accounts or cost. They require Chrome or Edge.

**Workflow**

1. The seller starts the call. The server returns a greeting, which the browser speaks.
2. The microphone opens automatically. The final transcript is sent to `/api/chat` with the full history.
3. The server computes a deterministic diagnosis from the mock data (sales and orders down 32.5%, cancellations 8% to 14%, out-of-stock products 5 to 18, price flat), then sends the system prompt, data, diagnosis and history to Gemini.
4. Gemini returns `{ reply, phase, summary? }` where the phase moves greeting, discovery, recommendation, summary. The reply is spoken and the loop repeats.
5. In the summary phase the UI shows key issues, recommendations and next steps.

**Design decisions**

- **Facts in code, conversation in the model.** Percentages and rankings are computed deterministically and given to the model as grounding, so numbers are never invented.
- **Voice-first prompt.** Short replies, one question per turn, spoken currency, no markdown. The prompt lives in `prompts/system-prompt.md`.
- **Never dead-end.** If the LLM is unavailable, a rule-based engine runs the same call flow.
- **Natural interaction.** Hands-free turn taking, tap-to-interrupt, live captions, a typed fallback, and English or Hindi.

**Assumptions.** Seller persona and 60 active listings are invented; visibility is inferred because the data has no traffic metrics. See `docs/assumptions.md`.

**Run it.** `npm install`, add `GEMINI_API_KEY` to `.env`, then `npm run dev` and open http://localhost:5173 in Chrome.
