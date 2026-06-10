export type GameMode = "pvp" | "pvai" | "aivai";
export type GameType = "connect4" | "tictactoe" | "reversi";
export type AiStrategy = "easy" | "medium" | "hard";
export type PlayerType = "human" | "ai";

export interface NewGameRequest {
  game_type: GameType;
  mode: GameMode;
  starting_player: 1 | 2;
  ai_strategy_p1: AiStrategy;
  ai_strategy_p2: AiStrategy;
}

export interface HistoryItem {
  turn: number;
  player: 1 | 2;
  row: number;
  column: number;
}

export interface BoardCell {
  row: number;
  column: number;
}

export interface AiMetadata {
  reason?: string | null;
  score?: number | null;
  depth?: number | null;
  legal_moves_considered?: number[] | null;
  strategy?: AiStrategy | null;
  chosen_column?: number | null;
  chosen_row?: number | null;
  flipped_cell_count?: number | null;
  positional_factors?: Record<string, unknown> | null;
}

export interface GameState {
  game_id: string;
  game_type: GameType;
  mode: GameMode;
  player_types: Record<string, PlayerType>;
  ai_strategies: Record<string, AiStrategy | null>;
  board: number[][];
  history: HistoryItem[];
  current_player: 1 | 2;
  winner: 0 | 1 | 2 | null;
  legal_moves: number[];
  last_move: HistoryItem | null;
  winning_cells: BoardCell[];
  flipped_cells: BoardCell[];
  score?: Record<string, number> | null;
  pass_turn?: {
    passed: boolean;
    player: 1 | 2 | null;
    message: string | null;
  } | null;
  status: "in_progress" | "finished";
}

export interface MoveResponse {
  game_id: string;
  move_result: {
    row: number;
    column: number;
    player: 1 | 2;
    winner: 0 | 1 | 2 | null;
    flipped_cells?: BoardCell[];
    score?: Record<string, number>;
    pass_turn?: GameState["pass_turn"];
  };
  state: GameState;
  explanation: string | null;
  ai_metadata: AiMetadata | null;
}
