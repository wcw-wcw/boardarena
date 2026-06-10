# BoardArena

BoardArena is a polished local-first board game arena built with a React/Vite/TypeScript frontend and a FastAPI backend. The frontend presents a small catalog of games, while the backend remains the source of truth for session state, rule validation, legal moves, win/draw detection, and AI move selection.

## Available Games

- Connect 4: playable, with PvP, human-vs-AI, AI-vs-AI, move history, local stats, AI explanations, last-move highlighting, winning-cell highlighting, and spectator controls.
- Tic-Tac-Toe: playable, with PvP, human-vs-AI, AI-vs-AI, easy/medium/hard AI, move history, local stats, AI explanations, last-move highlighting, winning-line highlighting, wins, and draws.
- Reversi / Othello: playable, with PvP, human-vs-AI, AI-vs-AI, easy/medium/hard AI, legal move indicators, disc flipping, pass-turn handling, score-based endings, last-move and flipped-disc highlighting, move history, local stats, AI explanations, and spectator controls.
- Gomoku: coming soon.

## Tech Stack

- Frontend: React 19, TypeScript, Vite, plain CSS.
- Backend: FastAPI, Pydantic, Uvicorn.
- Game logic: Python, NumPy for Connect 4, standard Python structures for Tic-Tac-Toe and Reversi.
- Persistence: none. Backend sessions are in memory; browser match stats use localStorage.

## Run The Backend

Install dependencies from the repository root:

```bash
python3 -m pip install -r backend/requirements.txt
```

Start the API:

```bash
python3 -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

Health check:

```bash
curl -sS http://127.0.0.1:8000/health
```

## Run The Frontend

Install frontend dependencies:

```bash
cd frontend
npm install
```

Start Vite:

```bash
npm run dev -- --port 5173
```

Open:

```text
http://127.0.0.1:5173/
```

The frontend defaults to `http://127.0.0.1:8000` for the API. Override it at build time with:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
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

Frontend validation:

```bash
cd frontend
npm install
npm run build
```

## Architecture Overview

The backend exposes game-session APIs under `/games`. `POST /games` accepts a `game_type` of `connect4`, `tictactoe`, or `reversi` and defaults to `connect4` for backward compatibility. The in-memory game store creates the correct rules engine, tracks player control mode, and returns a shared state shape: game type, board, current player, winner, status, legal moves, move history, last move, winning cells, flipped cells when relevant, score when relevant, pass-turn state when relevant, AI strategies, and player types.

Each rules engine owns authoritative validation and move application. Connect 4 keeps its existing drop-column model. Tic-Tac-Toe uses backend row/column validation from the request and internal `0..8` legal move indexes for AI and state metadata. Reversi uses standard 8x8 directional scanning across all eight lines, flips every bracketed run, automatically handles forced passes, and ends by disc count when neither player has a legal move.

AI selection is routed by game type. Connect 4 keeps its existing easy random, medium tactical/heuristic, and hard minimax-style search. Tic-Tac-Toe adds easy random play, medium win/block/heuristic play, and hard full minimax optimal play. Reversi adds easy random play, medium corner/risk/flip heuristics, and hard bounded alpha-beta search. AI responses include explanation metadata such as chosen move, strategy, reason, score, depth, legal moves considered, flipped-disc count, and positional factors when available.

The frontend uses a game catalog registry to render playable and coming-soon games. The main app shares match flow, mode/difficulty controls, AI stepping, spectator controls, move history, AI explanations, and per-game local stats across games, while rendering game-specific board components for Connect 4, Tic-Tac-Toe, and Reversi.

## API Routes

- `GET /health`: confirms the API process is running.
- `POST /games`: creates a game session.
- `GET /games/{game_id}`: returns the current game state.
- `POST /games/{game_id}/moves/human`: applies a human move after backend validation.
- `POST /games/{game_id}/moves/ai`: asks the backend AI to move for the current AI-controlled player.

Create a Tic-Tac-Toe game:

```bash
curl -sS -X POST http://127.0.0.1:8000/games \
  -H "Content-Type: application/json" \
  -d '{"game_type":"tictactoe","mode":"pvai","starting_player":1,"ai_strategy_p2":"hard"}'
```

Create a Reversi game:

```bash
curl -sS -X POST http://127.0.0.1:8000/games \
  -H "Content-Type: application/json" \
  -d '{"game_type":"reversi","mode":"pvai","starting_player":1,"ai_strategy_p2":"medium"}'
```

Create a backward-compatible Connect 4 game:

```bash
curl -sS -X POST http://127.0.0.1:8000/games \
  -H "Content-Type: application/json" \
  -d '{"mode":"pvai","starting_player":1,"ai_strategy_p2":"medium"}'
```

## Current Limitations

- No auth, accounts, database persistence, online multiplayer, or saved match history.
- Backend sessions are process-local and reset when the API restarts.
- Multiple API worker processes would not share game state.
- Local match stats are per-browser and can be cleared with site data.
- No LLM API calls are wired into gameplay or explanations.
- No configured lint command or formal frontend test suite.
- Backend smoke tests are simple Python functions; pytest is not listed as a dependency.
- Reversi hard AI uses a bounded depth-4 alpha-beta search for local responsiveness; it is strategic but not a tournament-strength engine.
- CORS is permissive for local development and should be tightened before deployment.
- `backend/client.py`, `backend/con4old.py`, and `backend/README_API.md` are legacy or backend-only artifacts.

## Recommended Next Milestone

The next recommended milestone is Gomoku as the fourth playable game. It should add a larger-grid rules engine, five-in-a-row validation, scalable board rendering, focused AI heuristics, and smoke tests without adding auth, persistence, or online multiplayer.
