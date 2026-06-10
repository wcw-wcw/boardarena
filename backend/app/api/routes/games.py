from fastapi import APIRouter, HTTPException, status

from backend.app.schemas.game import GameStateResponse, MoveRequest, MoveResponse, NewGameRequest
from backend.app.services.ai_service import ai_service
from backend.app.services.game_manager import game_store

router = APIRouter(prefix="/games", tags=["games"])


@router.post("", response_model=GameStateResponse, status_code=status.HTTP_201_CREATED)
def create_game(payload: NewGameRequest) -> GameStateResponse:
    session = game_store.create_game(
        game_type=payload.game_type,
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

    move = _request_to_move(session.game_type, payload)
    if not session.game.is_valid_move(move):
        detail = f"Column {payload.column} is not a legal move." if session.game_type == "connect4" else "That square is not a legal move."
        raise HTTPException(status_code=400, detail=detail)

    try:
        move_result = session.game.make_move(move)
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


def _request_to_move(game_type: str, payload: MoveRequest) -> int:
    if game_type == "tictactoe":
        if payload.row is None:
            raise HTTPException(status_code=400, detail="Tic-Tac-Toe moves require both row and column.")
        if payload.row > 2 or payload.column > 2:
            raise HTTPException(status_code=400, detail="Tic-Tac-Toe row and column must be between 0 and 2.")
        return payload.row * 3 + payload.column
    if game_type == "reversi":
        if payload.row is None:
            raise HTTPException(status_code=400, detail="Reversi moves require both row and column.")
        return payload.row * 8 + payload.column
    if payload.column > 6:
        raise HTTPException(status_code=400, detail="Connect 4 columns must be between 0 and 6.")
    return payload.column
