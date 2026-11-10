# SnapKAM: AI Voice-Powered Virtual Key Account Manager

A voice-first AI assistant that acts as a Virtual Key Account Manager (KAM) for an online marketplace seller. The seller talks about a business concern, for example "my sales have dropped", and the assistant listens, asks relevant follow-up questions, diagnoses likely causes from account data, recommends practical actions, and closes the call with a summary.

Built for the Snapdeal AI First Intern practical assignment. The original brief is in [docs/assignment](docs/assignment/).

## Features

- **Natural two-way voice conversation** using speech-to-text and text-to-speech, with hands-free turn taking, tap-to-interrupt and live captions
- **Grounded diagnosis** of the sales decline across inventory, cancellations, visibility and pricing, computed from mock seller data
- **Adaptive follow-up questions**, one at a time, in a short spoken style
- **2-3 practical recommendations** tied to the evidence
- **End-of-call summary** of key issues, recommendations and next steps, with copy-to-clipboard
- **English and Hindi** voice conversation
- **Resilient by design**: falls back to an offline rule-based engine if the LLM is unavailable
- **Polished UI**: responsive layout, animated voice orb, light and dark themes, accessible controls
- **Typed fallback** for browsers or situations where the microphone is unavailable

## Tech stack

| Area     | Technology                                                         |
| -------- | ------------------------------------------------------------------ |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide icons          |
| Backend  | Node.js, Express 5, TypeScript, zod                                |
| AI       | Google Gemini (structured JSON output) via `@google/genai`         |
| Voice    | Browser Web Speech API (`SpeechRecognition` and `speechSynthesis`) |
| Quality  | Vitest, ESLint, Prettier, GitHub Actions CI                        |

## Quick start

**Prerequisites:** Node.js 20 or newer, and Google Chrome or Microsoft Edge (for speech recognition).

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#    then set GEMINI_API_KEY (get one at https://aistudio.google.com/apikey)

# 3. Start the API (port 3000) and the web app (port 5173)
npm run dev
```

Open http://localhost:5173, allow microphone access, and press **Start call**.

> No API key? Leave `GEMINI_API_KEY` empty and the app runs in **offline demo mode** with a deterministic rule-based conversation. The UI shows an "Offline demo mode" badge.

### Production build

```bash
npm run build   # builds the server and the client
npm start       # serves the API and the built client on http://localhost:3000
```

## Scripts

| Command             | Description                                   |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Run API and web app with hot reload           |
| `npm run build`     | Type-check and build both workspaces          |
| `npm start`         | Run the built server (also serves the client) |
| `npm test`          | Run all unit and API tests                    |
| `npm run typecheck` | TypeScript checks for both workspaces         |
| `npm run lint`      | ESLint                                        |
| `npm run format`    | Format the repository with Prettier           |

## Configuration

All settings are environment variables, documented in [.env.example](.env.example).

| Variable         | Default                 | Description                                         |
| ---------------- | ----------------------- | --------------------------------------------------- |
| `PORT`           | `3000`                  | API port                                            |
| `CORS_ORIGIN`    | `http://localhost:5173` | Origin allowed to call the API                      |
| `GEMINI_API_KEY` | empty                   | Enables the Gemini engine; empty means offline mode |
| `GEMINI_MODEL`   | `gemini-2.5-flash`      | Gemini model name                                   |
| `LOG_LEVEL`      | `info`                  | `debug`, `info`, `warn` or `error`                  |

## Mock data

The conversation is grounded in [data/seller-data.json](data/seller-data.json):

| Metric                | Last month | This month |
| --------------------- | ---------- | ---------- |
| Sales                 | ₹2,00,000  | ₹1,35,000  |
| Orders                | 400        | 270        |
| Cancellation rate     | 8%         | 14%        |
| Average selling price | ₹500       | ₹500       |
| Out-of-stock products | 5          | 18         |

Only mock data is used. No Snapdeal systems, data or credentials are involved. All additional assumptions are listed in [docs/assumptions.md](docs/assumptions.md).

## Project structure

```
.
├── client/                 # React + Vite + Tailwind web app
│   └── src/
│       ├── components/     # VoiceStage, VoiceOrb, Transcript, MetricsPanel, ...
│       ├── hooks/          # useCall, useSpeechRecognition, useSpeechSynthesis, ...
│       ├── lib/            # API client, formatting, speech text helpers
│       └── types/
├── server/                 # Express API
│   ├── src/
│   │   ├── config/         # env validation, paths
│   │   ├── middleware/     # error handling
│   │   ├── routes/         # /api/chat, /api/seller
│   │   ├── services/       # diagnosis, Gemini + rule-based engines, prompt
│   │   └── utils/
│   └── tests/
├── data/                   # Mock seller data
├── prompts/                # System prompt (kept out of code)
├── docs/                   # Architecture, assumptions, assignment, submission note
└── .github/workflows/      # CI
```

## How it works

```
Seller -mic-> Speech-to-text -> /api/chat -> Diagnosis + Gemini -> reply -> Text-to-speech -> Seller
```

The numbers are computed deterministically in code and given to the model as grounding, so the assistant never invents figures. The model handles conversation, adaptation and phrasing. See [docs/architecture.md](docs/architecture.md) for details and [docs/submission/note.md](docs/submission/note.md) for the one-page summary.

## Browser support

Speech recognition requires a Chromium-based browser (Chrome or Edge). Other browsers show a notice and fall back to typed replies. Microphone access needs `localhost` or HTTPS.

## Security

Secrets live in `.env`, which is git-ignored. The API validates all input, sets security headers, restricts CORS and rate-limits requests.
