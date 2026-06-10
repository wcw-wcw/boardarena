import type { GameState } from "../games/connect4/types";

interface ReversiBoardProps {
  game: GameState | null;
  isBusy: boolean;
  onCellSelect: (row: number, column: number) => void;
}

const emptyBoard = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 0));

export function ReversiBoard({ game, isBusy, onCellSelect }: ReversiBoardProps) {
  const board = game?.board ?? emptyBoard;
  const legalMoves = new Set(game?.legal_moves ?? []);
  const canPlay = Boolean(game && game.status === "in_progress" && !isBusy);
  const lastMoveKey = game?.last_move ? `${game.last_move.row}-${game.last_move.column}` : "";
  const flippedCellKeys = new Set((game?.flipped_cells ?? []).map((cell) => `${cell.row}-${cell.column}`));

  return (
    <div className="reversi-wrap" aria-label="Reversi board">
      <div className="reversi-grid">
        {board.flatMap((row, rowIndex) =>
          row.map((cell, columnIndex) => {
            const cellKey = `${rowIndex}-${columnIndex}`;
            const moveIndex = rowIndex * 8 + columnIndex;
            const isLegal = legalMoves.has(moveIndex);
            const classes = ["reversi-cell"];
            if (lastMoveKey === cellKey) classes.push("last-move");
            if (flippedCellKeys.has(cellKey)) classes.push("flipped-cell");
            if (isLegal) classes.push("legal-cell");

            return (
              <button
                aria-label={`Play row ${rowIndex + 1}, column ${columnIndex + 1}`}
                className={classes.join(" ")}
                disabled={!canPlay || !isLegal}
                key={cellKey}
                onClick={() => onCellSelect(rowIndex, columnIndex)}
                type="button"
              >
                {cell !== 0 ? <span className={`reversi-disc player-${cell}`} /> : <span className="legal-marker" />}
              </button>
            );
          }),
        )}
      </div>
      {game?.pass_turn?.passed ? <p className="pass-message">{game.pass_turn.message}</p> : null}
    </div>
  );
}
