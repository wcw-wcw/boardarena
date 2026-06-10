import type { GameMode, AiStrategy } from "../games/connect4/types";

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
