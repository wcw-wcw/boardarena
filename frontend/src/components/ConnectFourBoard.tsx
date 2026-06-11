import type { GameState } from "../games/connect4/types";

interface ConnectFourBoardProps {
  game: GameState | null;
  isBusy: boolean;
  onColumnSelect: (column: number) => void;
}

const emptyBoard = Array.from({ length: 6 }, () => Array.from({ length: 7 }, () => 0));

export function ConnectFourBoard({ game, isBusy, onColumnSelect }: ConnectFourBoardProps) {
  const board = game?.board ?? emptyBoard;
  const legalMoves = new Set(game?.legal_moves ?? []);
  const canPlay = Boolean(game && game.status === "in_progress" && !isBusy);
  const lastMoveKey = game?.last_move ? `${game.last_move.row}-${game.last_move.column}` : "";
  const winningCellKeys = new Set((game?.winning_cells ?? []).map((cell) => `${cell.row}-${cell.column}`));

  return (
    <div className="board-wrap" aria-label="Connect 4 board" data-testid="board-connect4">
      <div className="column-actions">
        {Array.from({ length: 7 }, (_, column) => (
          <button
            className="drop-button"
            aria-label={`Drop in column ${column + 1}`}
            data-testid={`connect4-drop-${column}`}
            disabled={!canPlay || !legalMoves.has(column)}
            key={column}
            onClick={() => onColumnSelect(column)}
            title={`Drop in column ${column + 1}`}
            type="button"
          >
            <span>{column + 1}</span>
          </button>
        ))}
      </div>
      <div className="board-grid" data-testid="connect4-grid">
        {board.flatMap((row, rowIndex) =>
          row.map((cell, columnIndex) => {
            const cellKey = `${rowIndex}-${columnIndex}`;
            const classes = ["cell"];
            if (lastMoveKey === cellKey) classes.push("last-move");
            if (winningCellKeys.has(cellKey)) classes.push("winning-cell");
            return (
              <div className={classes.join(" ")} data-column={columnIndex} key={cellKey}>
                <span className={`disc player-${cell}`} />
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
