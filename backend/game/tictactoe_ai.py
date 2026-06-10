import random
from typing import Any

WIN_LINES = (
    (0, 1, 2),
    (3, 4, 5),
    (6, 7, 8),
    (0, 3, 6),
    (1, 4, 7),
    (2, 5, 8),
    (0, 4, 8),
    (2, 4, 6),
)


def _flatten(board: list[list[int]]) -> list[int]:
    return [cell for row in board for cell in row]


def _legal_moves(board: list[int]) -> list[int]:
    return [index for index, value in enumerate(board) if value == 0]


def _winner(board: list[int]) -> int | None:
    for a, b, c in WIN_LINES:
        if board[a] != 0 and board[a] == board[b] == board[c]:
            return board[a]
    if not _legal_moves(board):
        return 0
    return None


def _play(board: list[int], move: int, player: int) -> list[int]:
    next_board = board.copy()
    next_board[move] = player
    return next_board


def _find_immediate_win(board: list[int], player: int) -> int | None:
    for move in _ordered_moves(board):
        if _winner(_play(board, move, player)) == player:
            return move
    return None


def _ordered_moves(board: list[int]) -> list[int]:
    order = {4: 0, 0: 1, 2: 1, 6: 1, 8: 1, 1: 2, 3: 2, 5: 2, 7: 2}
    return sorted(_legal_moves(board), key=lambda move: order[move])


def _heuristic_move(board: list[int], player: int) -> tuple[int | None, int]:
    legal_moves = _ordered_moves(board)
    if not legal_moves:
        return None, 0

    opponent = 2 if player == 1 else 1
    best_move = legal_moves[0]
    best_score = -10_000
    for move in legal_moves:
        candidate = _play(board, move, player)
        score = 0
        for line in WIN_LINES:
            values = [candidate[index] for index in line]
            if opponent not in values:
                score += values.count(player) ** 2
            if player not in values:
                score -= values.count(opponent) ** 2
        if move == 4:
            score += 3
        if move in {0, 2, 6, 8}:
            score += 1
        if score > best_score:
            best_score = score
            best_move = move

    return best_move, best_score


def _minimax(board: list[int], player_to_move: int, ai_player: int, depth: int) -> tuple[int | None, int]:
    terminal = _winner(board)
    if terminal is not None:
        if terminal == ai_player:
            return None, 10 - depth
        if terminal == 0:
            return None, 0
        return None, depth - 10

    legal_moves = _ordered_moves(board)
    best_move = legal_moves[0]
    maximizing = player_to_move == ai_player
    best_score = -10_000 if maximizing else 10_000
    next_player = 2 if player_to_move == 1 else 1

    for move in legal_moves:
        _, score = _minimax(_play(board, move, player_to_move), next_player, ai_player, depth + 1)
        if maximizing and score > best_score:
            best_score = score
            best_move = move
        if not maximizing and score < best_score:
            best_score = score
            best_move = move

    return best_move, best_score


def choose_tictactoe_ai_move(game, strategy: str = "medium") -> dict[str, Any]:
    if strategy not in {"easy", "medium", "hard"}:
        raise ValueError(f"Unsupported AI strategy: {strategy}")

    board = _flatten(game.board)
    player = game.current_player
    opponent = 2 if player == 1 else 1
    legal_moves = game.get_legal_moves()

    if not legal_moves:
        return {"move": None, "strategy": strategy, "explanation": "No legal moves remain.", "metadata": {}}

    if strategy == "easy":
        move = random.choice(legal_moves)
        return {
            "move": move,
            "strategy": strategy,
            "explanation": f"I picked square {move + 1} from the legal moves at random.",
            "metadata": {"reason": "random", "legal_moves_considered": legal_moves},
        }

    winning_move = _find_immediate_win(board, player)
    if winning_move is not None:
        return {
            "move": winning_move,
            "strategy": strategy,
            "explanation": f"I can win immediately by playing square {winning_move + 1}.",
            "metadata": {"reason": "winning_move", "legal_moves_considered": legal_moves},
        }

    blocking_move = _find_immediate_win(board, opponent)
    if blocking_move is not None:
        return {
            "move": blocking_move,
            "strategy": strategy,
            "explanation": f"I need to block the immediate threat on square {blocking_move + 1}.",
            "metadata": {"reason": "blocking_move", "legal_moves_considered": legal_moves},
        }

    if strategy == "medium":
        move, score = _heuristic_move(board, player)
        return {
            "move": move,
            "strategy": strategy,
            "explanation": f"I chose square {move + 1} because it improves my lines.",
            "metadata": {"reason": "heuristic", "score": score, "legal_moves_considered": legal_moves},
        }

    move, score = _minimax(board, player, player, 0)
    return {
        "move": move,
        "strategy": strategy,
        "explanation": f"I searched the full game tree and found square {move + 1} as my strongest move.",
        "metadata": {"reason": "minimax", "score": score, "depth": len(legal_moves), "legal_moves_considered": legal_moves},
    }
