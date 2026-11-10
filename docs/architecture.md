# Architecture

SnapKAM is a TypeScript monorepo with two npm workspaces: a React single-page app (`client`) and an Express API (`server`).

```
 Seller                Browser (client)                       Server                   Google Gemini
 ------                ----------------                       ------                   -------------
 speaks  ──mic──►  SpeechRecognition (STT)
                        │ final transcript
                        ▼
                   useCall state machine ──POST /api/chat──►  validate (zod)
                        ▲                                      ConversationService
                        │                                       ├─ GeminiEngine ───────────────► generateContent
                        │                                       │   system prompt + seller data     (JSON schema)
                        │                                       │   + diagnosis + history       ◄───  { reply, phase, summary? }
                        │                                       └─ RuleBasedEngine (fallback)
 hears   ◄──speaker── SpeechSynthesis (TTS) ◄── { reply, phase, summary?, engine }
```

## Conversation loop

1. The seller presses **Start call**. The client posts an empty transcript and the bot greets the seller.
2. The reply is spoken with the browser's speech synthesis.
3. When speech ends, the microphone opens automatically (hands-free). The seller can also tap the orb to interrupt the bot, or type a reply.
4. The final transcript is appended to the history and posted to `/api/chat`. The server is **stateless**: the client sends the full history each turn.
5. If the seller hangs up before the bot finishes, the client calls `/api/chat` with `endCall: true` and the server returns the closing summary immediately.
6. The loop repeats through the phases `greeting`, `discovery`, `recommendation` and `summary`. When the bot returns the `summary` phase, it also returns a structured summary and the client shows the summary card.

## Server

| Module                               | Responsibility                                                                                                                            |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `config/env.ts`                      | Validates environment variables with zod and fails fast on bad config.                                                                    |
| `services/seller.service.ts`         | Loads and validates `data/seller-data.json`.                                                                                              |
| `services/diagnosis.service.ts`      | Pure functions that compare months, rank insights (inventory, cancellations, visibility, pricing), and build the recommendation playbook. |
| `services/prompt.service.ts`         | Renders `prompts/system-prompt.md` with language, turn count and the seller context.                                                      |
| `services/gemini-engine.service.ts`  | Calls Gemini with a JSON response schema and validates the output with zod.                                                               |
| `services/rule-engine.service.ts`    | Deterministic fallback conversation, used when no API key is set or the LLM call fails.                                                   |
| `services/conversation.service.ts`   | Picks the engine and degrades gracefully to the fallback.                                                                                 |
| `routes/*`, `middleware/*`, `app.ts` | HTTP layer: helmet, CORS, rate limiting, request validation, central error handling.                                                      |

### Why the diagnosis is computed in code, not by the LLM

Arithmetic and ranking are deterministic, so they are done in `diagnosis.service.ts` and handed to the model as facts. The model is responsible for what it is good at: natural conversation, adapting to the seller's answers, and phrasing. This keeps numbers accurate and makes the behaviour testable.

### Prompt design

`prompts/system-prompt.md` defines the persona, voice-style rules (short replies, one question per turn, no markdown, spoken currency), the four conversation phases, grounding rules (only use numbers from the data, treat visibility as an inference) and the output format. It is kept outside the code so it can be reviewed and changed without touching TypeScript.

### Resilience

- If `GEMINI_API_KEY` is missing, or a Gemini call times out or returns invalid JSON, the server answers with the rule-based engine and reports `engine: "rule-based"`. The UI shows an "Offline demo mode" badge, so a call never dead-ends.
- Model output is validated with zod. A `summary` phase without a structured summary is completed from the diagnosis.

## Client

| Module                          | Responsibility                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| `hooks/useCall.ts`              | Call state machine: connecting, thinking, speaking, listening, waiting, ended.        |
| `hooks/useSpeechRecognition.ts` | Promise-based wrapper over `SpeechRecognition` (final, silence, aborted, permission). |
| `hooks/useSpeechSynthesis.ts`   | Promise-based text-to-speech with voice selection and sentence chunking.              |
| `components/VoiceStage.tsx`     | Orb, live captions, call controls, language switch, typed fallback.                   |
| `components/*`                  | Transcript, metric cards, insights, summary, header with light/dark theme toggle.     |

Styling uses Tailwind CSS v4 with semantic design tokens (`surface`, `card`, `fg`, `brand`...) defined as CSS variables, so the light and dark themes only differ in one place.

## Testing

- Server: diagnosis maths, rule-engine conversation flow, and the HTTP API (health, seller, chat validation, 404).
- Client: formatting and speech-text helpers.
- The voice loop depends on browser speech APIs and is verified manually in Chrome or Edge.
