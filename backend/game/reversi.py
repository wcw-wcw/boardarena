from __future__ import annotations


class Reversi:
    ROWS = 8
    COLS = 8
    DIRECTIONS = (
        (-1, -1),
        (-1, 0),
        (-1, 1),
        (0, -1),
        (0, 1),
        (1, -1),
        (1, 0),
        (1, 1),
    )

    def __init__(self, starting_player=1):
        self.board = [[0 for _ in range(self.COLS)] for _ in range(self.ROWS)]
        self.history = []
        self.current_player = starting_player
        self.winner = None
        self.last_move = None
        self.winning_cells = []
        self.flipped_cells = []
        self.pass_turn = {"passed": False, "player": None, "message": None}
        self.score = {1: 2, 2: 2}
        self._seed_starting_discs()

    def reset(self, starting_player=1):
        self.board = [[0 for _ in range(self.COLS)] for _ in range(self.ROWS)]
        self.history = []
        self.current_player = starting_player
        self.winner = None
        self.last_move = None
        self.winning_cells = []
        self.flipped_cells = []
        self.pass_turn = {"passed": False, "player": None, "message": None}
        self._seed_starting_discs()
        self._update_score()

    def _seed_starting_discs(self):
        self.board[3][3] = 2
        self.board[3][4] = 1
        self.board[4][3] = 1
        self.board[4][4] = 2
        self._update_score()

    def get_legal_moves(self):
        return self.get_legal_moves_for_player(self.current_player)

    def get_legal_moves_for_player(self, player):
        return [
            row * self.COLS + col
            for row in range(self.ROWS)
            for col in range(self.COLS)
            if self.board[row][col] == 0 and self._flips_for_move(row, col, player)
        ]

    def is_valid_move(self, move):
        return move in self.get_legal_moves()

    def make_move(self, move):
        if self.winner is not None:
            raise ValueError("Game is already over.")

        if not self.is_valid_move(move):
            raise ValueError("That square is not a legal Reversi move.")

        row, col = divmod(move, self.COLS)
        player = self.current_player
        flips = self._flips_for_move(row, col, player)

        self.board[row][col] = player
        # Every valid direction contributes a run of bracketed opponent discs; all runs flip together.
        for flip_row, flip_col in flips:
            self.board[flip_row][flip_col] = player

        history_move = {
            "turn": len(self.history) + 1,
            "player": player,
            "row": row,
            "column": col,
        }
        self.history.append(history_move)
        self.last_move = history_move.copy()
        self.flipped_cells = [{"row": flip_row, "column": flip_col} for flip_row, flip_col in flips]
        self._update_score()
        self._advance_turn_after_move(player)

        return {
            "row": row,
            "column": col,
            "player": player,
            "winner": self.winner,
            "flipped_cells": self.flipped_cells,
            "score": self.score.copy(),
            "pass_turn": self.pass_turn.copy(),
        }

    def _flips_for_move(self, row, col, player):
        if not self._is_on_board(row, col) or self.board[row][col] != 0:
            return []

        opponent = 2 if player == 1 else 1
        flips = []
        for row_delta, col_delta in self.DIRECTIONS:
            line = []
            scan_row = row + row_delta
            scan_col = col + col_delta
            # A direction is valid only when one or more opponent discs are followed by the current player.
            while self._is_on_board(scan_row, scan_col) and self.board[scan_row][scan_col] == opponent:
                line.append((scan_row, scan_col))
                scan_row += row_delta
                scan_col += col_delta
            if line and self._is_on_board(scan_row, scan_col) and self.board[scan_row][scan_col] == player:
                flips.extend(line)
        return flips

    def _advance_turn_after_move(self, player):
        opponent = 2 if player == 1 else 1
        opponent_moves = self.get_legal_moves_for_player(opponent)
        player_moves = self.get_legal_moves_for_player(player)

        if opponent_moves:
            self.current_player = opponent
            self.pass_turn = {"passed": False, "player": None, "message": None}
            return

        if player_moves:
            # Reversi has forced passes: when the opponent has no legal move, control stays with the mover.
            self.current_player = player
            self.pass_turn = {
                "passed": True,
                "player": opponent,
                "message": f"Player {opponent} has no legal moves and must pass.",
            }
            return

        self.pass_turn = {
            "passed": True,
            "player": opponent,
            "message": "Both players have no legal moves. Final score decides the game.",
        }
        self._finish_by_score()

    def _finish_by_score(self):
        if self.score[1] > self.score[2]:
            self.winner = 1
        elif self.score[2] > self.score[1]:
            self.winner = 2
        else:
            self.winner = 0

    def _update_score(self):
        self.score = {
            1: sum(cell == 1 for row in self.board for cell in row),
            2: sum(cell == 2 for row in self.board for cell in row),
        }

    def _is_on_board(self, row, col):
        return 0 <= row < self.ROWS and 0 <= col < self.COLS

    def copy(self):
        new_game = Reversi(starting_player=self.current_player)
        new_game.board = [row.copy() for row in self.board]
        new_game.history = [move.copy() for move in self.history]
        new_game.winner = self.winner
        new_game.last_move = self.last_move.copy() if self.last_move else None
        new_game.winning_cells = []
        new_game.flipped_cells = [cell.copy() for cell in self.flipped_cells]
        new_game.pass_turn = self.pass_turn.copy()
        new_game.score = self.score.copy()
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
            "flipped_cells": self.flipped_cells,
            "score": self.score.copy(),
            "pass_turn": self.pass_turn.copy(),
        }
