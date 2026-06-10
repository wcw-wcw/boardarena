from __future__ import annotations

import random
from typing import Any

from backend.game.reversi import Reversi

HARD_DEPTH = 4
CORNERS = {0, 7, 56, 63}
EDGES = {index for index in range(64) if index // 8 in {0, 7} or index % 8 in {0, 7}}
RISKY_NEAR_CORNERS = {
    0: {1, 8, 9},
    7: {6, 14, 15},
    56: {48, 49, 57},
    63: {54, 55, 62},
}
POSITION_WEIGHTS = [
    [100, -25, 10, 5, 5, 10, -25, 100],
    [-25, -40, -5, -5, -5, -5, -40, -25],
    [10, -5, 4, 2, 2, 4, -5, 10],
    [5, -5, 2, 1, 1, 2, -5, 5],
    [5, -5, 2, 1, 1, 2, -5, 5],
    [10, -5, 4, 2, 2, 4, -5, 10],
    [-25, -40, -5, -5, -5, -5, -40, -25],
    [100, -25, 10, 5, 5, 10, -25, 100],
]


def choose_reversi_ai_move(game: Reversi, strategy: str = "medium") -> dict[str, Any]:
    if strategy not in {"easy", "medium", "hard"}:
        raise ValueError(f"Unsupported AI strategy: {strategy}")

    legal_moves = game.get_legal_moves()
    if not legal_moves:
        return {"move": None, "strategy": strategy, "explanation": "No legal Reversi moves are available.", "metadata": {}}

    if strategy == "easy":
        move = random.choice(legal_moves)
        return {
            "move": move,
            "strategy": strategy,
            "explanation": f"I picked {label_move(move)} from the legal moves at random.",
            "metadata": {"reason": "random", "legal_moves_considered": legal_moves},
        }

    if strategy == "medium":
        move, score, factors = _best_heuristic_move(game, game.current_player)
        return {
            "move": move,
            "strategy": strategy,
            "explanation": f"I chose {label_move(move)} because it balances corners, risk, and flip value.",
            "metadata": {
                "reason": factors["reason"],
                "score": score,
                "legal_moves_considered": legal_moves,
                "flipped_cell_count": factors["flipped_cell_count"],
                "positional_factors": factors,
            },
        }

    move, score = _minimax(game.copy(), HARD_DEPTH, -10_000_000, 10_000_000, game.current_player, game.current_player)
    if move is None:
        move, score, _ = _best_heuristic_move(game, game.current_player)
    factors = _move_factors(game, move, game.current_player)
    return {
        "move": move,
        "strategy": strategy,
        "explanation": f"I searched ahead to depth {HARD_DEPTH} and selected {label_move(move)}.",
        "metadata": {
            "reason": "alpha_beta",
            "score": score,
            "depth": HARD_DEPTH,
            "legal_moves_considered": legal_moves,
            "flipped_cell_count": factors["flipped_cell_count"],
            "positional_factors": factors,
        },
    }


def label_move(move: int) -> str:
    row, col = divmod(move, 8)
    return f"row {row + 1}, column {col + 1}"


def _best_heuristic_move(game: Reversi, player: int) -> tuple[int, int, dict[str, Any]]:
    scored = []
    for move in game.get_legal_moves_for_player(player):
        factors = _move_factors(game, move, player)
        score = factors["score"]
        scored.append((move, score, factors))
    return max(scored, key=lambda item: item[1])


def _move_factors(game: Reversi, move: int, player: int) -> dict[str, Any]:
    row, col = divmod(move, 8)
    flips = game._flips_for_move(row, col, player)
    score = len(flips) * 5 + POSITION_WEIGHTS[row][col]
    reason = "positional"

    if move in CORNERS:
        score += 120
        reason = "corner"
    elif move in EDGES:
        score += 12
        reason = "edge"

    risky = _is_risky_near_empty_corner(game, move)
    if risky:
        score -= 90
        reason = "risk_managed"

    return {
        "score": score,
        "reason": reason,
        "flipped_cell_count": len(flips),
        "corner": move in CORNERS,
        "edge": move in EDGES,
        "risky_near_empty_corner": risky,
    }


def _is_risky_near_empty_corner(game: Reversi, move: int) -> bool:
    for corner, risky_moves in RISKY_NEAR_CORNERS.items():
        corner_row, corner_col = divmod(corner, 8)
        if game.board[corner_row][corner_col] == 0 and move in risky_moves:
            return True
    return False


def _minimax(game: Reversi, depth: int, alpha: int, beta: int, player_to_move: int, ai_player: int) -> tuple[int | None, int]:
    if depth == 0 or game.winner is not None:
        return None, _evaluate(game, ai_player)

    legal_moves = game.get_legal_moves_for_player(player_to_move)
    opponent = 2 if player_to_move == 1 else 1
    if not legal_moves:
        opponent_moves = game.get_legal_moves_for_player(opponent)
        if not opponent_moves:
            game._finish_by_score()
            return None, _evaluate(game, ai_player)
        # Search forced passes by changing only the side to move; no board mutation occurs.
        return _minimax(game, depth - 1, alpha, beta, opponent, ai_player)

    ordered_moves = sorted(legal_moves, key=lambda move: _move_factors(game, move, player_to_move)["score"], reverse=True)
    maximizing = player_to_move == ai_player
    best_move = ordered_moves[0]

    if maximizing:
        value = -10_000_000
        for move in ordered_moves:
            child = game.copy()
            child.current_player = player_to_move
            child.make_move(move)
            _, score = _minimax(child, depth - 1, alpha, beta, child.current_player, ai_player)
            if score > value:
                value = score
                best_move = move
            alpha = max(alpha, value)
            # Alpha-beta keeps hard mode bounded enough for local play while still searching tactical replies.
            if alpha >= beta:
                break
        return best_move, value

    value = 10_000_000
    for move in ordered_moves:
        child = game.copy()
        child.current_player = player_to_move
        child.make_move(move)
        _, score = _minimax(child, depth - 1, alpha, beta, child.current_player, ai_player)
        if score < value:
            value = score
            best_move = move
        beta = min(beta, value)
        # Alpha-beta keeps hard mode bounded enough for local play while still searching tactical replies.
        if alpha >= beta:
            break
    return best_move, value


def _evaluate(game: Reversi, ai_player: int) -> int:
    opponent = 2 if ai_player == 1 else 1
    if game.winner == ai_player:
        return 1_000_000
    if game.winner == opponent:
        return -1_000_000
    if game.winner == 0:
        return 0

    ai_moves = len(game.get_legal_moves_for_player(ai_player))
    opponent_moves = len(game.get_legal_moves_for_player(opponent))
    ai_corners = _count_positions(game, ai_player, CORNERS)
    opponent_corners = _count_positions(game, opponent, CORNERS)
    ai_edges = _count_positions(game, ai_player, EDGES)
    opponent_edges = _count_positions(game, opponent, EDGES)
    disc_diff = game.score[ai_player] - game.score[opponent]

    # Evaluation weights stable corner ownership and mobility above early disc count, which can be deceptive in Reversi.
    return (
        (ai_corners - opponent_corners) * 260
        + (ai_moves - opponent_moves) * 22
        + (ai_edges - opponent_edges) * 8
        + disc_diff * 3
        + _positional_score(game, ai_player)
        - _positional_score(game, opponent)
    )


def _count_positions(game: Reversi, player: int, positions: set[int]) -> int:
    return sum(1 for move in positions if game.board[move // 8][move % 8] == player)


def _positional_score(game: Reversi, player: int) -> int:
    return sum(
        POSITION_WEIGHTS[row][col]
        for row in range(8)
        for col in range(8)
        if game.board[row][col] == player
    )
