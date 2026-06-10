# BoardArena

BoardArena is a local-first AI board-game arena built with React, Vite, TypeScript, and FastAPI. It is designed as a portfolio-ready full-stack app: the frontend delivers a polished multi-game experience, while the backend owns game sessions, legal move validation, state transitions, scoring, and AI move selection.

## Features

- Three playable games with a shared session model: Connect 4, Tic-Tac-Toe, and Reversi / Othello.
- PvP, human-vs-AI, and AI-vs-AI modes.
- Easy, medium, and hard AI strategies per game.
- Move history, current-turn state, legal move indicators, and last-move highlights.
- Winning-cell or flipped-cell highlights where the game rules support them.
- Reversi score display and forced-pass/game-over messaging.
- AI explanation metadata with chosen move, strategy, reason, score/depth when available, and legal moves considered.
- Spectator controls for AI-vs-AI matches.
- Per-game localStorage stats for quick demo sessions.
- Backend-owned rule validation, so illegal moves are rejected by the API.

## Playable Games

- **Connect 4**: drop-column gameplay with win detection, tactical AI, and winning-cell highlights.
- **Tic-Tac-Toe**: compact perfect-information play with full minimax hard mode.
- **Reversi / Othello**: 8x8 disc flipping, legal move hints, pass-turn handling, score-based endings, and positional AI heuristics.
- **Gomoku**: catalog placeholder for a future milestone.

## Screenshots

Screenshots are not committed yet. Add real desktop and mobile screenshots after a hosted or locally captured demo is ready; avoid generated build artifacts or fake placeholder images.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, plain CSS.
- **Backend**: FastAPI, Pydantic, Uvicorn.
- **Game logic**: Python; NumPy for Connect 4, standard Python structures for Tic-Tac-Toe and Reversi.
- **Persistence**: none on the backend. Browser-only match stats use localStorage.

## AI Strategy Overview

- **Easy**: random legal move.
- **Medium**: game-specific tactical heuristics.
  - Connect 4 looks for wins, blocks, and useful board shape.
  - Tic-Tac-Toe prioritizes win/block opportunities and line strength.
  - Reversi prefers corners, avoids risky squares near empty corners when possible, and values flips/position.
- **Hard**: bounded search.
  - Connect 4 uses minimax-style search with alpha-beta pruning.
  - Tic-Tac-Toe searches the full game tree.
  - Reversi uses bounded depth-4 alpha-beta search with corners, edges, mobility, disc differential, and positional weights.

## Local Setup

Install backend dependencies from the repository root:

```bash
python3 -m pip install -r backend/requirements.txt
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

## Run The Backend

From the repository root:

```bash
python3 -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

Health check:

```bash
curl -sS http://127.0.0.1:8000/health
```

## Run The Frontend

From `frontend/`:

```bash
npm run dev -- --port 5173
```

Open:

```text
http://127.0.0.1:5173/
```

The frontend defaults to `http://127.0.0.1:8000` for the API. For a different local or deployed API, set `VITE_API_BASE_URL` when running or building the frontend:

```bash
VITE_API_BASE_URL=https://your-api.example.com npm run build
```

## Validation

Backend compile check:

```bash
python3 -m compileall backend
```

Backend smoke tests:

```bash
python3 -c "from backend.tests import test_medium_ai_takes_winning_move, test_medium_ai_blocks_immediate_threat, test_hard_ai_prefers_center_opening, test_connect_four_returns_winning_cells, test_tictactoe_returns_winning_cells, test_tictactoe_draw_detection, test_tictactoe_medium_ai_takes_winning_move, test_tictactoe_medium_ai_blocks_immediate_threat, test_tictactoe_hard_ai_prefers_center_opening, test_reversi_initial_board_state, test_reversi_starting_legal_moves, test_reversi_move_application_flips_discs, test_reversi_invalid_move_rejection, test_reversi_pass_turn_behavior, test_reversi_game_over_scoring_draw, test_reversi_ai_move_generation; test_medium_ai_takes_winning_move(); test_medium_ai_blocks_immediate_threat(); test_hard_ai_prefers_center_opening(); test_connect_four_returns_winning_cells(); test_tictactoe_returns_winning_cells(); test_tictactoe_draw_detection(); test_tictactoe_medium_ai_takes_winning_move(); test_tictactoe_medium_ai_blocks_immediate_threat(); test_tictactoe_hard_ai_prefers_center_opening(); test_reversi_initial_board_state(); test_reversi_starting_legal_moves(); test_reversi_move_application_flips_discs(); test_reversi_invalid_move_rejection(); test_reversi_pass_turn_behavior(); test_reversi_game_over_scoring_draw(); test_reversi_ai_move_generation(); print('backend smoke tests passed')"
```

Frontend checks:

```bash
cd frontend
npm install
npm run typecheck
npm run build
```

Whitespace check before committing:

```bash
git diff --check
```

## Technical Highlights

- Shared backend session architecture supports multiple game engines behind one `/games` API surface.
- Rules engines keep validation authoritative on the server instead of trusting the client.
- Game state responses expose the metadata each board needs while preserving a common frontend flow.
- AI move responses include structured explanation metadata for a transparent demo experience.
- The React app shares mode controls, AI stepping, spectator controls, history, stats, and catalog behavior across games while keeping board rendering game-specific.
- Reversi includes directional scanning, multi-direction flipping, forced-pass handling, and score-based terminal states.

## Deployment Notes

- The frontend can be hosted as a static Vite build.
- The FastAPI backend should be hosted separately as an ASGI service.
- Configure the frontend build with `VITE_API_BASE_URL` when the API is not available at `http://127.0.0.1:8000`.
- Do not commit secrets or local environment files.
- Generated artifacts such as `frontend/dist`, `frontend/node_modules`, Python bytecode, `.DS_Store`, and local env files should remain ignored.
- CORS is currently permissive for local development and should be tightened before a public deployment.

## Current Limitations

- No auth, accounts, database persistence, online multiplayer, or saved match history.
- Backend sessions are in memory and reset when the API restarts.
- Multiple backend workers would not share game state.
- Local match stats are per-browser and can be cleared with site data.
- No LLM API calls are wired into gameplay or explanations.
- No formal frontend test suite.
- ESLint is not configured yet; the current lightweight frontend quality gate is TypeScript typechecking plus the production build.
- Backend smoke tests are simple Python functions; pytest is not listed as a dependency.
- Reversi hard AI is bounded for local responsiveness and is not a tournament-strength engine.

## Future Roadmap

- Add Gomoku as the fourth playable game.
- Add a small automated frontend test suite for critical flows.
- Add real screenshots and optional hosted-demo links.
- Add stricter production CORS and deployment configuration.
- Consider persistent match history after the local-first demo is stable.
