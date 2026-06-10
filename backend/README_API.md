# BoardArena - FastAPI milestone

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload
```

## Endpoints

- `GET /health`
- `POST /games`
- `GET /games/{game_id}`
- `POST /games/{game_id}/moves/human`
- `POST /games/{game_id}/moves/ai`

## Example: create a Human vs AI game

```bash
curl -X POST http://127.0.0.1:8000/games \
  -H "Content-Type: application/json" \
  -d '{"mode":"pvai","starting_player":1,"ai_strategy_p2":"medium"}'
```

## Example: make a human move

```bash
curl -X POST http://127.0.0.1:8000/games/<game_id>/moves/human \
  -H "Content-Type: application/json" \
  -d '{"column":3}'
```

## Example: make an AI move

```bash
curl -X POST http://127.0.0.1:8000/games/<game_id>/moves/ai
```
