# LLM Game Arena

LLM Game Arena is a small full-stack game playground. The current playable game is Connect 4, with a React/Vite frontend and a FastAPI backend that owns game sessions, rule validation, and AI moves. The project is structured so more games can be added later without making Connect 4-specific code leak through the whole app.

## Current Features

- Connect 4 board with legal move handling and win/draw detection.
- Local two-player mode.
- Human vs AI mode.
- AI vs AI sparring mode.
- Easy, medium, and hard AI strategies.
- AI move explanations returned from the backend.
- Last-move and winning-cell highlights.
- AI-vs-AI spectator pause, step, and speed controls.
- Local-only match stats stored in browser localStorage.
- Frontend game catalog placeholder for future games.
- In-memory game sessions for local development.

## Tech Stack

- Frontend: React 19, TypeScript, Vite, plain CSS.
- Backend: FastAPI, Pydantic, Uvicorn.
- Game logic: Python, NumPy.
- Persistence: none yet. Game sessions are stored in process memory.
- Database: `database/` exists as a placeholder, but there are no migrations or tables yet.

## Repository Layout

```text
backend/
  app/
    api/routes/       FastAPI route handlers
    schemas/          Pydantic request/response models
    services/         API-facing game and AI services
    main.py           FastAPI app setup
  game/               Connect 4 rules and AI strategy logic
  client.py           Legacy terminal client
  con4old.py          Older script-style prototype
  README_API.md       Backend-only API notes
  requirements.txt    Python dependencies
database/             Placeholder for future migrations
frontend/
  src/                React app source
  package.json        Frontend scripts and dependencies
```

## Requirements

- Python 3.11+ recommended.
- Node.js 20+ recommended.
- npm.

The current local machine has also been tested with Python 3.14 and Node 24.

## Setup

Install backend dependencies from the repository root:

```bash
python3 -m pip install -r backend/requirements.txt
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

`frontend/node_modules/` and `frontend/dist/` are generated locally and are intentionally ignored. Do not rely on checked-in frontend dependencies or build output.

## Environment Variables

The backend does not currently require environment variables.

The frontend supports:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

If unset, the frontend defaults to `http://127.0.0.1:8000`.

## Run Locally

Start the API from the repository root:

```bash
python3 -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

Start the frontend:

```bash
cd frontend
npm run dev -- --port 5173
```

Open:

```text
http://127.0.0.1:5173/
```

Health check:

```bash
curl -sS http://127.0.0.1:8000/health
```

## Scripts And Commands

Frontend scripts:

```bash
cd frontend
npm run dev
npm run build
npm run preview
```

Backend validation commands currently available:

```bash
python3 -m compileall backend
python3 -c "from backend.tests import test_medium_ai_takes_winning_move, test_medium_ai_blocks_immediate_threat, test_hard_ai_prefers_center_opening, test_connect_four_returns_winning_cells; test_medium_ai_takes_winning_move(); test_medium_ai_blocks_immediate_threat(); test_hard_ai_prefers_center_opening(); test_connect_four_returns_winning_cells(); print('backend smoke tests passed')"
```

There is no configured lint command yet. `backend/tests.py` contains pytest-style tests, but `pytest` is not listed in `backend/requirements.txt`.

Frontend validation:

```bash
cd frontend
npm install
npm run build
```

## API Routes

- `GET /health`: confirms the API process is running.
- `POST /games`: creates a game session.
- `GET /games/{game_id}`: returns the current game state.
- `POST /games/{game_id}/moves/human`: applies a human move.
- `POST /games/{game_id}/moves/ai`: asks the backend AI to move for the current AI-controlled player.

Example game creation:

```bash
curl -sS -X POST http://127.0.0.1:8000/games \
  -H "Content-Type: application/json" \
  -d '{"mode":"pvai","starting_player":1,"ai_strategy_p2":"medium"}'
```

## Database And Migrations

There is no active database integration yet.

- `database/` is empty.
- Game sessions are kept in the backend process by `InMemoryGameStore`.
- Browser match stats are stored only in localStorage.
- Restarting the API clears all games.
- Multiple API worker processes would not share game state.

When persistence is added, start with tables for users, games, moves, AI settings, and optional LLM conversation turns. Add migrations under `database/migrations/` and document the migration command here.

## Deployment Notes

- Build the frontend with `npm run build` from `frontend/`.
- Serve `frontend/dist` from a static host or behind the same domain as the API.
- Deploy the FastAPI app with Uvicorn/Gunicorn or another ASGI host.
- Set `VITE_API_BASE_URL` at frontend build time if the API is not hosted at `http://127.0.0.1:8000`.
- Restrict CORS before public deployment. The current backend allows all origins for local development.
- Add persistent storage before running more than one backend worker or deploying to an environment where process restarts are expected.

## LLM Integration Direction

No LLM is currently wired into the runtime. The safest path is to keep game rules and legal move validation deterministic in the backend, then add an LLM as a conversational coach/commentator.

Recommended shape:

- Add a backend chat endpoint such as `POST /games/{game_id}/chat`.
- Send compact game state, legal moves, move history, current player, and recent AI explanation to the LLM.
- Require structured output for optional hints or tone changes.
- Never let the LLM directly mutate the board.
- Validate all suggested moves against `legal_moves`.
- Store any player-adaptation profile separately from the move engine.

Local/free options such as Ollama can be integrated behind a service object without changing frontend game flow.

## Known Limitations

- No persistence, auth, accounts, or saved match history.
- Local match stats are per-browser and can be cleared with site data.
- No active database migrations.
- No configured lint command.
- No formal frontend test suite.
- Backend tests are pytest-style but pytest is not installed by default.
- CORS is permissive and intended only for development.
- AI is heuristic/minimax-based, not LLM-based.
- `backend/client.py` and `backend/con4old.py` are legacy terminal/prototype files.
- `frontend/dist` may exist locally after a build and should be treated as generated output.
