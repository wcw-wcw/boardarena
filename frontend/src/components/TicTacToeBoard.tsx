import type { GameState } from "../games/connect4/types";

interface TicTacToeBoardProps {
  game: GameState | null;
  isBusy: boolean;
  onCellSelect: (row: number, column: number) => void;
}

const emptyBoard = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => 0));

export function TicTacToeBoard({ game, isBusy, onCellSelect }: TicTacToeBoardProps) {
  const board = game?.board ?? emptyBoard;
  const legalMoves = new Set(game?.legal_moves ?? []);
  const canPlay = Boolean(game && game.status === "in_progress" && !isBusy);
  const lastMoveKey = game?.last_move ? `${game.last_move.row}-${game.last_move.column}` : "";
  const winningCellKeys = new Set((game?.winning_cells ?? []).map((cell) => `${cell.row}-${cell.column}`));

  return (
    <div className="ttt-wrap" aria-label="Tic-Tac-Toe board">
      <div className="ttt-grid">
        {board.flatMap((row, rowIndex) =>
          row.map((cell, columnIndex) => {
            const cellKey = `${rowIndex}-${columnIndex}`;
            const moveIndex = rowIndex * 3 + columnIndex;
            const classes = ["ttt-cell"];
            if (lastMoveKey === cellKey) classes.push("last-move");
            if (winningCellKeys.has(cellKey)) classes.push("winning-cell");

            return (
              <button
                aria-label={`Play row ${rowIndex + 1}, column ${columnIndex + 1}`}
                className={classes.join(" ")}
                disabled={!canPlay || !legalMoves.has(moveIndex)}
                key={cellKey}
                onClick={() => onCellSelect(rowIndex, columnIndex)}
                type="button"
              >
                <span className={`mark player-${cell}`}>{cell === 1 ? "X" : cell === 2 ? "O" : ""}</span>
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
