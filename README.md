# Stormhacks_2025

Lightweight React + Node prototype: an empathetic AI chat UI (Tessa) with summarization and TTS support.

This repo contains a Vite + React frontend and a small Express backend proxy that provides a few helper APIs (location, weather, ElevenLabs voice proxy, ElevenLabs TTS, and a Gemini summarization endpoint).

## Features

- Chat UI (React) with voice input support.
- Manual conversation summarization using Google Gemini (server-side) and stores summaries in localStorage.
- Text-to-speech playback for assistant replies via ElevenLabs (server-side) with browser SpeechSynthesis fallback.
- Voice selection; heuristics prefer a British female voice when available.
- Summaries dropdown in the chat header, saved to `localStorage`.

## Quick start (Windows PowerShell)

Prerequisites

- Node.js (18+ recommended)
- npm (or pnpm/yarn if you prefer)
- (Optional) ElevenLabs API key for server-side TTS
- (Optional) Gemini API key for summarization

1. Clone repo (already present in your workspace)

2. Install frontend deps and run Vite dev server

```powershell
# from repo root
npm install
npm run dev
```

3. Start backend server

```powershell
cd .\my-backend
npm install
# create a .env with the variables described below, then:
node server.js
```

By default the frontend will run on the Vite port (usually http://localhost:5173) and the backend listens on port 3000 unless you set `PORT`.

## Environment variables

Create a `.env` at `my-backend/.env` or set environment variables in your environment. The server reads these keys via `dotenv`.

- `ELEVENLABS_API_KEY` (or `ELEVEN_API_KEY`) — required for ElevenLabs voice list and server-side TTS. If not present the client will fall back to browser TTS.
- `GEMINI_API_KEY` (or `API_KEY`) — required for the `/api/summarize` endpoint using Google GenAI (Gemini). If not present, summarization endpoint returns 503.
- `PORT` — optional server listen port (defaults to 3000).

Example `.env` (my-backend/.env):

```
ELEVENLABS_API_KEY=your_elevenlabs_key_here
GEMINI_API_KEY=your_gemini_key_here
PORT=3000
```

## Important files

- Frontend

  - `components/ChatInterface.tsx` — main chat UI, summarization UI, voice selection, and TTS invocation
  - `App.tsx`, `index.tsx`, other React app files
  - `main.css`, `src/styles/global.css` — primary styles

- Backend
  - `my-backend/server.js` — Express server providing:
    - `GET /api/voices` — proxies ElevenLabs voices list
    - `POST /api/tts` — posts text to ElevenLabs TTS and returns audio bytes
    - `POST /api/summarize` — summarizes conversation using Gemini
    - `GET /api/location` and `GET /api/weather` — utility endpoints

## Client behavior & storage

- Summaries are stored in `localStorage` under the key `chat_summaries` (array of strings; newest first).
- TTS enabled flag stored under `tts_enabled` (value `'1'` => enabled).
- Selected ElevenLabs voice id stored under `eleven_voice_id`.
- When available the app prefers a British female voice (heuristic) and persists the selection.

## Using the app

- Type in the chat input or use voice input (if supported) and send to the bot.
- Click "Summarize" to create a concise summary of the conversation (sends messages to `/api/summarize`).
- Use the Summaries dropdown to insert a saved summary back into the input box.
- Toggle TTS (Voice On / Voice Off) to enable/disable spoken assistant replies. When enabled, assistant replies attempt to be played via the backend ElevenLabs TTS; fallback to browser TTS if the server is not configured.

## Previewing a voice (suggested)

A small preview button can be added to the UI to call `/api/tts` with quick sample text. If you want that, open an issue or I can add it for you.

## Troubleshooting

- PowerShell execution policy when running `npx` or scripts: you can temporarily bypass for the current session:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npx tsc --noEmit
```

- If ElevenLabs audio fails to play, verify `ELEVENLABS_API_KEY` and check server logs; browser autoplay policies may block audio until user interacts with the page (send a message or click to allow sounds).

- If summaries return 503, ensure `GEMINI_API_KEY`/`API_KEY` is set and valid.

## Contributing / next steps

- Add a small voice preview button beside the voice selector (I can implement this on request).
- Improve voice labeling (show country/gender metadata cleanly in the select menu).
- Add server-side caching for voice list and summaries.

## License

This project contains a LICENSE file in the repository root. Follow that license for reuse.

---

If you want, I can now add a one-click "Preview voice" button in the chat header that plays a short sample using the selected ElevenLabs voice — should I add that next?
