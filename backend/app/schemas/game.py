from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

GameMode = Literal["pvp", "pvai", "aivai"]
GameType = Literal["connect4", "tictactoe", "reversi"]
PlayerType = Literal["human", "ai"]
AIStrategy = Literal["easy", "medium", "hard"]


class NewGameRequest(BaseModel):
    game_type: GameType = "connect4"
    mode: GameMode = "pvai"
    starting_player: int = Field(default=1, ge=1, le=2)
    ai_strategy_p1: AIStrategy = "medium"
    ai_strategy_p2: AIStrategy = "medium"


class MoveRequest(BaseModel):
    column: int = Field(..., ge=0, le=7)
    row: int | None = Field(default=None, ge=0, le=7)


class BoardCell(BaseModel):
    row: int
    column: int


class HistoryMove(BoardCell):
    turn: int
    player: int


class AIMetadata(BaseModel):
    reason: str | None = None
    score: int | None = None
    depth: int | None = None
    legal_moves_considered: list[int] | None = None
    strategy: AIStrategy | None = None
    chosen_column: int | None = None
    chosen_row: int | None = None
    flipped_cell_count: int | None = None
    positional_factors: dict | None = None


class GameStateResponse(BaseModel):
    game_id: str
    game_type: GameType
    mode: GameMode
    player_types: dict[int, PlayerType]
    ai_strategies: dict[int, AIStrategy | None]
    board: list[list[int]]
    history: list[HistoryMove]
    current_player: int
    winner: int | None
    legal_moves: list[int]
    last_move: HistoryMove | None = None
    winning_cells: list[BoardCell] = Field(default_factory=list)
    flipped_cells: list[BoardCell] = Field(default_factory=list)
    score: dict[int, int] | None = None
    pass_turn: dict | None = None
    status: Literal["in_progress", "finished"]


class MoveResponse(BaseModel):
    game_id: str
    move_result: dict
    state: GameStateResponse
    explanation: str | None = None
    ai_metadata: AIMetadata | None = None


class ErrorResponse(BaseModel):
    detail: str
