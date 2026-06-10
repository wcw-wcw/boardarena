import random
from typing import Any

WINDOW_LENGTH = 4
HARD_DEPTH = 5
MEDIUM_DEPTH = 3


def get_random_ai_move(game) -> int | None:
    legal_moves = game.get_legal_moves()
    if not legal_moves:
        return None
    return random.choice(legal_moves)


def _drop_piece(board, col: int, player: int) -> tuple[Any, int] | tuple[None, None]:
    next_board = board.copy()
    for row in range(game_rows(board) - 1, -1, -1):
        if next_board[row][col] == 0:
            next_board[row][col] = player
            return next_board, row
    return None, None


def game_rows(board) -> int:
    return len(board)


def game_cols(board) -> int:
    return len(board[0])


def _legal_moves_for_board(board) -> list[int]:
    return [col for col in range(game_cols(board)) if board[0][col] == 0]


def _winning_move(board, player: int) -> bool:
    rows = game_rows(board)
    cols = game_cols(board)

    for row in range(rows):
        for col in range(cols - 3):
            if all(board[row][col + offset] == player for offset in range(WINDOW_LENGTH)):
                return True

    for col in range(cols):
        for row in range(rows - 3):
            if all(board[row + offset][col] == player for offset in range(WINDOW_LENGTH)):
                return True

    for row in range(rows - 3):
        for col in range(cols - 3):
            if all(board[row + offset][col + offset] == player for offset in range(WINDOW_LENGTH)):
                return True

    for row in range(3, rows):
        for col in range(cols - 3):
            if all(board[row - offset][col + offset] == player for offset in range(WINDOW_LENGTH)):
                return True

    return False


def _score_window(window: list[int], player: int) -> int:
    opponent = 2 if player == 1 else 1
    player_count = window.count(player)
    opponent_count = window.count(opponent)
    empty_count = window.count(0)

    # These weights favor immediate wins/blocks first, then center control and expandable two-disc shapes.
    if player_count == 4:
        return 100000
    if player_count == 3 and empty_count == 1:
        return 100
    if player_count == 2 and empty_count == 2:
        return 12
    if opponent_count == 3 and empty_count == 1:
        return -95
    if opponent_count == 2 and empty_count == 2:
        return -10
    return 0


def _score_position(board, player: int) -> int:
    score = 0
    rows = game_rows(board)
    cols = game_cols(board)
    center_col = cols // 2
    center_count = [int(board[row][center_col]) for row in range(rows)].count(player)
    score += center_count * 8

    for row in range(rows):
        row_values = [int(board[row][col]) for col in range(cols)]
        for col in range(cols - 3):
            score += _score_window(row_values[col : col + WINDOW_LENGTH], player)

    for col in range(cols):
        col_values = [int(board[row][col]) for row in range(rows)]
        for row in range(rows - 3):
            score += _score_window(col_values[row : row + WINDOW_LENGTH], player)

    for row in range(rows - 3):
        for col in range(cols - 3):
            score += _score_window([int(board[row + offset][col + offset]) for offset in range(WINDOW_LENGTH)], player)

    for row in range(3, rows):
        for col in range(cols - 3):
            score += _score_window([int(board[row - offset][col + offset]) for offset in range(WINDOW_LENGTH)], player)

    return score


def _terminal_score(board, ai_player: int, depth: int) -> int | None:
    opponent = 2 if ai_player == 1 else 1
    if _winning_move(board, ai_player):
        return 1_000_000 + depth
    if _winning_move(board, opponent):
        return -1_000_000 - depth
    if not _legal_moves_for_board(board):
        return 0
    return None


def _ordered_moves(board) -> list[int]:
    center = game_cols(board) // 2
    return sorted(_legal_moves_for_board(board), key=lambda col: abs(center - col))


def _minimax(board, depth: int, alpha: int, beta: int, maximizing: bool, ai_player: int) -> tuple[int | None, int]:
    terminal = _terminal_score(board, ai_player, depth)
    if depth == 0 or terminal is not None:
        return None, terminal if terminal is not None else _score_position(board, ai_player)

    opponent = 2 if ai_player == 1 else 1
    moves = _ordered_moves(board)
    best_move = moves[0] if moves else None

    if maximizing:
        value = -10_000_000
        for move in moves:
            child, _ = _drop_piece(board, move, ai_player)
            _, score = _minimax(child, depth - 1, alpha, beta, False, ai_player)
            if score > value:
                value = score
                best_move = move
            alpha = max(alpha, value)
            # Alpha-beta pruning keeps hard mode responsive by skipping branches that cannot improve the result.
            if alpha >= beta:
                break
        return best_move, value

    value = 10_000_000
    for move in moves:
        child, _ = _drop_piece(board, move, opponent)
        _, score = _minimax(child, depth - 1, alpha, beta, True, ai_player)
        if score < value:
            value = score
            best_move = move
        beta = min(beta, value)
        # Alpha-beta pruning keeps hard mode responsive by skipping branches that cannot improve the result.
        if alpha >= beta:
            break
    return best_move, value


def _choose_tactical_move(game, strategy: str) -> tuple[int | None, str, dict[str, Any]]:
    player = game.current_player
    opponent = 2 if player == 1 else 1
    board = game.board
    legal_moves = game.get_legal_moves()

    for move in _ordered_moves(board):
        child, _ = _drop_piece(board, move, player)
        if _winning_move(child, player):
            return move, f"I can win immediately by playing column {move + 1}.", {"reason": "winning_move"}

    for move in _ordered_moves(board):
        child, _ = _drop_piece(board, move, opponent)
        if _winning_move(child, opponent):
            return move, f"I need to block your threat in column {move + 1}.", {"reason": "blocking_move"}

    if strategy == "medium":
        scored_moves = sorted(
            ((move, _score_position(_drop_piece(board, move, player)[0], player)) for move in legal_moves),
            key=lambda item: item[1],
            reverse=True,
        )
        move, score = scored_moves[0]
        return move, f"I chose column {move + 1} because it improves my board shape.", {"score": score, "reason": "heuristic"}

    move, score = _minimax(board, HARD_DEPTH, -10_000_000, 10_000_000, True, player)
    if move is None:
        return None, "No legal moves remain.", {"reason": "no_legal_moves"}
    return move, f"I searched ahead and found column {move + 1} as my strongest move.", {"score": score, "depth": HARD_DEPTH}


def choose_ai_move(game, strategy: str = "medium") -> dict[str, Any]:
    """
    Thin AI service contract for the game layer.
    Keep this stable so the backend can later swap in stronger heuristics or Ollama.
    """
    if strategy not in {"easy", "medium", "hard"}:
        raise ValueError(f"Unsupported AI strategy: {strategy}")

    if strategy == "easy":
        move = get_random_ai_move(game)
        explanation = f"I picked column {move + 1} from the legal moves at random." if move is not None else "No legal moves remain."
        metadata = {"legal_moves_considered": game.get_legal_moves(), "reason": "random"}
    else:
        move, explanation, metadata = _choose_tactical_move(game, strategy)

    if move is None:
        return {
            "move": None,
            "strategy": strategy,
            "explanation": explanation,
            "metadata": {},
        }

    return {
        "move": move,
        "strategy": strategy,
        "explanation": explanation,
        "metadata": metadata | {"legal_moves_considered": game.get_legal_moves()},
    }
