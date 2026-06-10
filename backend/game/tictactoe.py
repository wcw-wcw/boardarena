class TicTacToe:
    ROWS = 3
    COLS = 3

    def __init__(self, starting_player=1):
        self.board = [[0 for _ in range(self.COLS)] for _ in range(self.ROWS)]
        self.history = []
        self.current_player = starting_player
        self.winner = None
        self.last_move = None
        self.winning_cells = []

    def reset(self, starting_player=1):
        self.board = [[0 for _ in range(self.COLS)] for _ in range(self.ROWS)]
        self.history = []
        self.current_player = starting_player
        self.winner = None
        self.last_move = None
        self.winning_cells = []

    def get_legal_moves(self):
        return [
            row * self.COLS + col
            for row in range(self.ROWS)
            for col in range(self.COLS)
            if self.board[row][col] == 0
        ]

    def is_valid_move(self, move):
        return move in self.get_legal_moves()

    def make_move(self, move):
        if self.winner is not None:
            raise ValueError("Game is already over.")

        if not self.is_valid_move(move):
            raise ValueError("That square is not a legal move.")

        row, col = divmod(move, self.COLS)
        self.board[row][col] = self.current_player

        history_move = {
            "turn": len(self.history) + 1,
            "player": self.current_player,
            "row": row,
            "column": col,
        }
        self.history.append(history_move)
        self.last_move = history_move.copy()

        winning_cells = self.get_winning_cells(row, col, self.current_player)
        if winning_cells:
            self.winner = self.current_player
            self.winning_cells = winning_cells
        elif self.is_draw():
            self.winner = 0

        played_by = self.current_player
        if self.winner is None:
            self.current_player = 2 if self.current_player == 1 else 1

        return {
            "row": row,
            "column": col,
            "player": played_by,
            "winner": self.winner,
            "winning_cells": self.winning_cells,
        }

    def is_draw(self):
        return all(cell != 0 for row in self.board for cell in row)

    def get_winning_cells(self, row, col, player):
        lines = [
            [(row, c) for c in range(self.COLS)],
            [(r, col) for r in range(self.ROWS)],
        ]
        if row == col:
            lines.append([(i, i) for i in range(self.ROWS)])
        if row + col == self.COLS - 1:
            lines.append([(i, self.COLS - 1 - i) for i in range(self.ROWS)])

        for line in lines:
            if all(self.board[cell_row][cell_col] == player for cell_row, cell_col in line):
                return [{"row": cell_row, "column": cell_col} for cell_row, cell_col in line]

        return []

    def copy(self):
        new_game = TicTacToe(starting_player=self.current_player)
        new_game.board = [row.copy() for row in self.board]
        new_game.history = [move.copy() for move in self.history]
        new_game.winner = self.winner
        new_game.last_move = self.last_move.copy() if self.last_move else None
        new_game.winning_cells = [cell.copy() for cell in self.winning_cells]
        return new_game

    def get_state(self):
        return {
            "board": [row.copy() for row in self.board],
            "history": self.history,
            "current_player": self.current_player,
            "winner": self.winner,
            "legal_moves": self.get_legal_moves(),
            "last_move": self.last_move,
            "winning_cells": self.winning_cells,
        }
