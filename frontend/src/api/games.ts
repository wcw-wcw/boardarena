import type { AiStrategy, GameMode, GameState, GameType, MoveResponse, NewGameRequest } from "../games/connect4/types";

const LOCAL_API_BASE_URL = "http://127.0.0.1:8000";
const PRODUCTION_API_BASE_URL = "/_backend";

function getApiBaseUrl(): string {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  const defaultUrl = import.meta.env.DEV ? LOCAL_API_BASE_URL : PRODUCTION_API_BASE_URL;
  return (configuredUrl || defaultUrl).replace(/\/+$/, "");
}

const API_BASE_URL = getApiBaseUrl();

function requestErrorMessage(): string {
  return `Cannot reach the BoardArena API at ${API_BASE_URL}. Check VITE_API_BASE_URL and make sure the FastAPI backend is running.`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json", ...init?.headers },
      ...init,
    });
  } catch {
    throw new Error(requestErrorMessage());
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `The BoardArena API returned ${response.status}. Please try again.`);
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
