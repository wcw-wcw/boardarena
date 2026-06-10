from fastapi import APIRouter, HTTPException, status

from backend.app.schemas.game import GameStateResponse, MoveRequest, MoveResponse, NewGameRequest
from backend.app.services.ai_service import ai_service
from backend.app.services.game_manager import game_store

router = APIRouter(prefix="/games", tags=["games"])


@router.post("", response_model=GameStateResponse, status_code=status.HTTP_201_CREATED)
def create_game(payload: NewGameRequest) -> GameStateResponse:
    session = game_store.create_game(
        mode=payload.mode,
        starting_player=payload.starting_player,
        ai_strategy_p1=payload.ai_strategy_p1,
        ai_strategy_p2=payload.ai_strategy_p2,
    )
    return game_store.to_state_response(session)


@router.get("/{game_id}", response_model=GameStateResponse)
def get_game(game_id: str) -> GameStateResponse:
    try:
        session = game_store.get_game(game_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return game_store.to_state_response(session)


@router.post("/{game_id}/moves/human", response_model=MoveResponse)
def make_human_move(game_id: str, payload: MoveRequest) -> MoveResponse:
    try:
        session = game_store.get_game(game_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    if session.game.winner is not None:
        raise HTTPException(status_code=409, detail="Game is already finished.")

    current_player = session.game.current_player
    if session.player_types[current_player] != "human":
        raise HTTPException(status_code=409, detail=f"Player {current_player} is not controlled by a human.")

    if not session.game.is_valid_move(payload.column):
        raise HTTPException(status_code=400, detail=f"Column {payload.column} is not a legal move.")

    try:
        move_result = session.game.make_move(payload.column)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return MoveResponse(
        game_id=session.game_id,
        move_result=move_result,
        state=game_store.to_state_response(session),
        explanation=None,
        ai_metadata=None,
    )


@router.post("/{game_id}/moves/ai", response_model=MoveResponse)
def make_ai_move(game_id: str) -> MoveResponse:
    try:
        session = game_store.get_game(game_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    if session.game.winner is not None:
        raise HTTPException(status_code=409, detail="Game is already finished.")

    current_player = session.game.current_player
    if session.player_types[current_player] != "ai":
        raise HTTPException(status_code=409, detail=f"Player {current_player} is not controlled by AI.")

    try:
        result = ai_service.generate_move(session)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return MoveResponse(
        game_id=session.game_id,
        move_result=result["move_result"],
        state=game_store.to_state_response(session),
        explanation=result["explanation"],
        ai_metadata=result["metadata"],
    )
