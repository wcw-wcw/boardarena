from __future__ import annotations

from dataclasses import dataclass
from threading import Lock
from uuid import uuid4

from backend.game.connect4 import ConnectFour

from backend.app.schemas.game import AIStrategy, GameMode, GameStateResponse, PlayerType


@dataclass
class GameSession:
    game_id: str
    game: ConnectFour
    mode: GameMode
    player_types: dict[int, PlayerType]
    ai_strategies: dict[int, AIStrategy | None]


class InMemoryGameStore:
    def __init__(self) -> None:
        # Sessions are intentionally process-local for now; restarts or multiple API workers will not share games.
        self._games: dict[str, GameSession] = {}
        self._lock = Lock()

    def create_game(
        self,
        mode: GameMode,
        starting_player: int,
        ai_strategy_p1: AIStrategy,
        ai_strategy_p2: AIStrategy,
    ) -> GameSession:
        player_types = self._resolve_player_types(mode)
        session = GameSession(
            game_id=str(uuid4()),
            game=ConnectFour(starting_player=starting_player),
            mode=mode,
            player_types=player_types,
            ai_strategies={
                1: ai_strategy_p1 if player_types[1] == "ai" else None,
                2: ai_strategy_p2 if player_types[2] == "ai" else None,
            },
        )
        with self._lock:
            self._games[session.game_id] = session
        return session

    def get_game(self, game_id: str) -> GameSession:
        try:
            return self._games[game_id]
        except KeyError as exc:
            raise KeyError(f"Game '{game_id}' was not found.") from exc

    def to_state_response(self, session: GameSession) -> GameStateResponse:
        state = session.game.get_state()
        return GameStateResponse(
            game_id=session.game_id,
            mode=session.mode,
            player_types=session.player_types,
            ai_strategies=session.ai_strategies,
            board=state["board"],
            history=state["history"],
            current_player=state["current_player"],
            winner=state["winner"],
            legal_moves=state["legal_moves"],
            last_move=state["last_move"],
            winning_cells=state["winning_cells"],
            status="finished" if state["winner"] is not None else "in_progress",
        )

    @staticmethod
    def _resolve_player_types(mode: GameMode) -> dict[int, PlayerType]:
        if mode == "pvp":
            return {1: "human", 2: "human"}
        if mode == "pvai":
            return {1: "human", 2: "ai"}
        if mode == "aivai":
            return {1: "ai", 2: "ai"}
        raise ValueError(f"Unsupported mode: {mode}")


game_store = InMemoryGameStore()
