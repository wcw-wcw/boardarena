import numpy as np


class ConnectFour:
    ROWS = 6
    COLS = 7

    def __init__(self, starting_player=1):
        self.board = np.zeros((self.ROWS, self.COLS), dtype=int)
        self.history = []
        self.current_player = starting_player
        self.winner = None
        self.last_move = None
        self.winning_cells = []

    def reset(self, starting_player=1):
        self.board = np.zeros((self.ROWS, self.COLS), dtype=int)
        self.history = []
        self.current_player = starting_player
        self.winner = None
        self.last_move = None
        self.winning_cells = []

    def get_legal_moves(self):
        return [col for col in range(self.COLS) if self.board[0][col] == 0]

    def is_valid_move(self, col):
        return col in self.get_legal_moves()

    def make_move(self, col):
        if self.winner is not None:
            raise ValueError("Game is already over.")

        if not self.is_valid_move(col):
            raise ValueError(f"Column {col + 1} is not a valid move.")

        placed_row = -1
        for row in range(self.ROWS - 1, -1, -1):
            if self.board[row][col] == 0:
                self.board[row][col] = self.current_player
                placed_row = row
                break

        move = {
            "turn": len(self.history) + 1,
            "player": self.current_player,
            "row": placed_row,
            "column": col,
        }
        self.history.append(move)
        self.last_move = move.copy()

        winning_cells = self.get_winning_cells(placed_row, col, self.current_player)
        if winning_cells:
            self.winner = self.current_player
            self.winning_cells = winning_cells
        elif self.is_draw():
            self.winner = 0

        played_by = self.current_player
        if self.winner is None:
            self.current_player = 2 if self.current_player == 1 else 1

        return {
            "row": placed_row,
            "column": col,
            "player": played_by,
            "winner": self.winner,
            "winning_cells": self.winning_cells,
        }

    def is_draw(self):
        return np.all(self.board != 0)

    def check_win(self, row, col, player):
        return bool(self.get_winning_cells(row, col, player))

    def get_winning_cells(self, row, col, player):
        directions = [
            (0, 1),   # horizontal
            (1, 0),   # vertical
            (1, 1),   # diagonal \
            (1, -1)   # diagonal /
        ]

        for dr, dc in directions:
            cells = [(row, col)]

            r, c = row + dr, col + dc
            while 0 <= r < self.ROWS and 0 <= c < self.COLS and self.board[r][c] == player:
                cells.append((r, c))
                r += dr
                c += dc

            r, c = row - dr, col - dc
            while 0 <= r < self.ROWS and 0 <= c < self.COLS and self.board[r][c] == player:
                cells.append((r, c))
                r -= dr
                c -= dc

            if len(cells) >= 4:
                ordered_cells = sorted(cells, key=lambda cell: cell[0] * dr + cell[1] * dc)
                move_index = ordered_cells.index((row, col))
                start = min(max(move_index - 3, 0), len(ordered_cells) - 4)
                return [{"row": cell_row, "column": cell_col} for cell_row, cell_col in ordered_cells[start : start + 4]]

        return []

    def copy(self):
        new_game = ConnectFour(starting_player=self.current_player)
        new_game.board = self.board.copy()
        new_game.history = [move.copy() for move in self.history]
        new_game.winner = self.winner
        new_game.last_move = self.last_move.copy() if self.last_move else None
        new_game.winning_cells = [cell.copy() for cell in self.winning_cells]
        return new_game

    def print_board(self):
        print(self.board)

    def get_state(self):
        return {
            "board": self.board.tolist(),
            "history": self.history,
            "current_player": self.current_player,
            "winner": self.winner,
            "legal_moves": self.get_legal_moves(),
            "last_move": self.last_move,
            "winning_cells": self.winning_cells,
        }
