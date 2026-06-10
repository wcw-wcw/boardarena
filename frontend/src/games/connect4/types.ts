export type GameMode = "pvp" | "pvai" | "aivai";
export type AiStrategy = "easy" | "medium" | "hard";
export type PlayerType = "human" | "ai";

export interface NewGameRequest {
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
}

export interface GameState {
  game_id: string;
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
  status: "in_progress" | "finished";
}

export interface MoveResponse {
  game_id: string;
  move_result: {
    row: number;
    column: number;
    player: 1 | 2;
    winner: 0 | 1 | 2 | null;
  };
  state: GameState;
  explanation: string | null;
  ai_metadata: AiMetadata | null;
}
