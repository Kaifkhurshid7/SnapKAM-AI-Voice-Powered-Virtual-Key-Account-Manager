# Mini AI Voice KAM

A browser-based, voice-first AI assistant that acts as a virtual Key Account Manager (KAM) for an online marketplace seller. The seller speaks about a business concern (for example, "my sales have dropped"), and the bot listens, asks follow-up questions, analyses mock seller data, and recommends practical actions, all by voice.

Built as a practical assignment for the Snapdeal AI First Intern programme. See [docs/assignment](docs/assignment/) for the original brief.

> **Status:** project scaffolding complete; implementation in progress.

## Features

- Two-way voice conversation (speech-to-text in, text-to-speech out)
- Greets the seller and identifies the reason for the call
- Asks relevant follow-up questions about the sales decline
- Diagnoses likely causes from mock data: inventory, cancellations, pricing, visibility
- Recommends 2-3 actionable next steps
- Ends with a summary of key issues, recommendations and next steps

## Mock data

The conversation is grounded in [data/seller-data.json](data/seller-data.json):

| Metric                | Last month | This month |
| --------------------- | ---------- | ---------- |
| Sales                 | ₹2,00,000  | ₹1,35,000  |
| Orders                | 400        | 270        |
| Cancellation rate     | 8%         | 14%        |
| Average selling price | ₹500       | ₹500       |
| Out-of-stock products | 5          | 18         |

Any further assumptions made are documented in [docs/assumptions.md](docs/assumptions.md). Only mock data is used; no Snapdeal systems, data or credentials are involved.

## Project structure

```
.
├── client/              # Browser UI (voice capture, playback, transcript)
│   ├── assets/
│   ├── css/
│   └── js/
├── server/              # Backend API (LLM orchestration, tools)
│   └── src/
│       ├── config/      # Environment and app configuration
│       ├── routes/      # HTTP route handlers
│       ├── services/    # LLM, seller-data and diagnosis logic
│       └── utils/
├── data/                # Mock seller data
├── prompts/             # System prompts and conversation guidelines
├── tests/               # Automated tests
├── docs/
│   ├── assignment/      # Original assignment brief
│   └── submission/      # One-page note and demo material
├── .env.example         # Required environment variables (copy to .env)
├── .editorconfig
├── .gitignore
└── README.md
```

## Architecture (planned)

```
Seller (mic) -> Speech-to-Text -> Backend + LLM (with seller data) -> Text-to-Speech -> Seller (speaker)
```

1. The browser captures speech and converts it to text.
2. The backend sends the conversation, system prompt and seller data to the LLM.
3. The LLM replies with a follow-up question, an insight or a recommendation.
4. The reply is spoken back to the seller, and the loop continues until the summary.

Model and voice-platform choices will be finalised and documented in [docs/submission](docs/submission/).

## Getting started

> Setup steps will be completed alongside the implementation.

```bash
# 1. Configure environment
cp .env.example .env     # then add your API key

# 2. Install and run (to be added)
```

Use a Chromium-based browser (Chrome or Edge) and allow microphone access when prompted.

## Deliverables

- [ ] Working demo or runnable prototype
- [ ] 1-2 minute screen recording of a real voice conversation
- [ ] One-page note on models, speech stack and workflow (`docs/submission/`)

## Security

Never commit secrets. Keep API keys in `.env` (git-ignored) and use `.env.example` as the template.
# SnapKAM-AI-Voice-Powered-Virtual-Key-Account-Manager
