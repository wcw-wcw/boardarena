import type { AiStrategy, GameMode, GameState, GameType, MoveResponse, NewGameRequest } from "../games/connect4/types";

// Vite inlines this at build time; set it when the API is not running on the local default.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail ?? "The game server returned an error.");
  }

  return response.json() as Promise<T>;
}

export function createGame(gameType: GameType, mode: GameMode, difficulty: AiStrategy): Promise<GameState> {
  const payload: NewGameRequest = {
    game_type: gameType,
    mode,
    starting_player: 1,
    ai_strategy_p1: difficulty,
    ai_strategy_p2: difficulty,
  };

  return request<GameState>("/games", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function makeHumanMove(gameId: string, column: number): Promise<MoveResponse> {
  return request<MoveResponse>(`/games/${gameId}/moves/human`, {
    method: "POST",
    body: JSON.stringify({ column }),
  });
}

export function makeHumanCellMove(gameId: string, row: number, column: number): Promise<MoveResponse> {
  return request<MoveResponse>(`/games/${gameId}/moves/human`, {
    method: "POST",
    body: JSON.stringify({ row, column }),
  });
}

export function makeAiMove(gameId: string): Promise<MoveResponse> {
  return request<MoveResponse>(`/games/${gameId}/moves/ai`, { method: "POST" });
}
