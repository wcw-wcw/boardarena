import type { GameMode, AiStrategy, GameType } from "../games/connect4/types";

export function modeLabel(mode: GameMode): string {
  return {
    pvp: "Local play",
    pvai: "Play vs AI",
    aivai: "AI sparring",
  }[mode];
}

export function difficultyLabel(strategy: AiStrategy): string {
  return {
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
  }[strategy];
}

export function winnerText(winner: 0 | 1 | 2 | null): string {
  if (winner === 0) return "Draw";
  if (winner === 1) return "Red wins";
  if (winner === 2) return "Yellow wins";
  return "";
}

export function playerName(gameType: GameType, player: 1 | 2): string {
  if (gameType === "reversi") return player === 1 ? "Black" : "White";
  if (gameType === "tictactoe") return player === 1 ? "X" : "O";
  return player === 1 ? "Red" : "Yellow";
}

export function moveLabel(gameType: GameType, row: number, column: number): string {
  if (gameType === "tictactoe" || gameType === "reversi") return `Row ${row + 1}, Column ${column + 1}`;
  return `Column ${column + 1}`;
}

export function legalMoveLabel(gameType: GameType, move: number): string {
  if (gameType === "reversi") return `${Math.floor(move / 8) + 1}-${(move % 8) + 1}`;
  if (gameType === "tictactoe") return `${Math.floor(move / 3) + 1}-${(move % 3) + 1}`;
  return String(move + 1);
}
