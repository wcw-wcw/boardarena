import type { GameType } from "./connect4/types";

export interface GameCatalogItem {
  id: GameType | "gomoku";
  name: string;
  status: "Playable" | "Coming soon";
  summary: string;
  playable: boolean;
}

export const gameCatalog: GameCatalogItem[] = [
  {
    id: "connect4",
    name: "Connect 4",
    status: "Playable",
    summary: "Drop discs, build a line of four, and tune the AI from casual to tactical.",
    playable: true,
  },
  {
    id: "tictactoe",
    name: "Tic-Tac-Toe",
    status: "Playable",
    summary: "Fast 3x3 tactics with local play, AI sparring, and perfect-play hard mode.",
    playable: true,
  },
  {
    id: "reversi",
    name: "Reversi / Othello",
    status: "Playable",
    summary: "Flip bracketed discs, fight for corners, and test bounded search against positional heuristics.",
    playable: true,
  },
  {
    id: "gomoku",
    name: "Gomoku",
    status: "Coming soon",
    summary: "Five-in-a-row arena slot reserved for a future larger-grid rules engine.",
    playable: false,
  },
];

export const playableGames = gameCatalog.filter((game): game is GameCatalogItem & { id: GameType } => game.playable);

export function gameName(gameType: GameType): string {
  return gameCatalog.find((game) => game.id === gameType)?.name ?? "BoardArena";
}
