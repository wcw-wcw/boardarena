from backend.game.ai import choose_ai_move
from backend.game.connect4 import ConnectFour
from backend.game.reversi import Reversi
from backend.game.reversi_ai import choose_reversi_ai_move
from backend.game.tictactoe import TicTacToe
from backend.game.tictactoe_ai import choose_tictactoe_ai_move
from backend.app.main import api_healthcheck, healthcheck


SMOKE_TESTS = []


def smoke_test(test_func):
    SMOKE_TESTS.append(test_func)
    return test_func


@smoke_test
def test_health_response_safe():
    for response in (healthcheck(), api_healthcheck()):
        assert response["status"] == "ok"
        assert response["app"] == "BoardArena API"
        assert "environment" in response
        assert "version" in response
        assert "ALLOWED_ORIGINS" not in response


@smoke_test
def test_medium_ai_takes_winning_move():
    game = ConnectFour(starting_player=1)
    game.board[5][0] = 1
    game.board[5][1] = 1
    game.board[5][2] = 1

    decision = choose_ai_move(game, "medium")

    assert decision["move"] == 3


@smoke_test
def test_medium_ai_blocks_immediate_threat():
    game = ConnectFour(starting_player=1)
    game.board[5][0] = 2
    game.board[5][1] = 2
    game.board[5][2] = 2

    decision = choose_ai_move(game, "medium")

    assert decision["move"] == 3


@smoke_test
def test_hard_ai_prefers_center_opening():
    game = ConnectFour(starting_player=1)

    decision = choose_ai_move(game, "hard")

    assert decision["move"] == 3


@smoke_test
def test_connect_four_returns_winning_cells():
    game = ConnectFour(starting_player=1)
    game.board[5][0] = 1
    game.board[5][1] = 1
    game.board[5][2] = 1

    result = game.make_move(3)

    assert result["winner"] == 1
    assert result["winning_cells"] == [
        {"row": 5, "column": 0},
        {"row": 5, "column": 1},
        {"row": 5, "column": 2},
        {"row": 5, "column": 3},
    ]
    assert game.get_state()["last_move"]["column"] == 3


@smoke_test
def test_tictactoe_returns_winning_cells():
    game = TicTacToe(starting_player=1)
    game.board[0][0] = 1
    game.board[0][1] = 1

    result = game.make_move(2)

    assert result["winner"] == 1
    assert result["winning_cells"] == [
        {"row": 0, "column": 0},
        {"row": 0, "column": 1},
        {"row": 0, "column": 2},
    ]
    assert game.get_state()["last_move"]["column"] == 2


@smoke_test
def test_tictactoe_draw_detection():
    game = TicTacToe(starting_player=1)
    for move in [0, 1, 2, 4, 3, 5, 7, 6, 8]:
        game.make_move(move)

    assert game.winner == 0


@smoke_test
def test_tictactoe_medium_ai_takes_winning_move():
    game = TicTacToe(starting_player=1)
    game.board[0][0] = 1
    game.board[0][1] = 1

    decision = choose_tictactoe_ai_move(game, "medium")

    assert decision["move"] == 2


@smoke_test
def test_tictactoe_medium_ai_blocks_immediate_threat():
    game = TicTacToe(starting_player=1)
    game.board[0][0] = 2
    game.board[0][1] = 2

    decision = choose_tictactoe_ai_move(game, "medium")

    assert decision["move"] == 2


@smoke_test
def test_tictactoe_hard_ai_prefers_center_opening():
    game = TicTacToe(starting_player=1)

    decision = choose_tictactoe_ai_move(game, "hard")

    assert decision["move"] == 4


@smoke_test
def test_reversi_initial_board_state():
    game = Reversi(starting_player=1)

    assert game.board[3][3] == 2
    assert game.board[3][4] == 1
    assert game.board[4][3] == 1
    assert game.board[4][4] == 2
    assert game.score == {1: 2, 2: 2}


@smoke_test
def test_reversi_starting_legal_moves():
    game = Reversi(starting_player=1)

    assert set(game.get_legal_moves()) == {19, 26, 37, 44}


@smoke_test
def test_reversi_move_application_flips_discs():
    game = Reversi(starting_player=1)

    result = game.make_move(19)

    assert result["flipped_cells"] == [{"row": 3, "column": 3}]
    assert game.board[2][3] == 1
    assert game.board[3][3] == 1
    assert game.score == {1: 4, 2: 1}
    assert game.current_player == 2


@smoke_test
def test_reversi_invalid_move_rejection():
    game = Reversi(starting_player=1)

    try:
        game.make_move(0)
    except ValueError as exc:
        assert "legal Reversi move" in str(exc)
    else:
        raise AssertionError("Expected invalid Reversi move to be rejected.")


@smoke_test
def test_reversi_pass_turn_behavior():
    game = Reversi(starting_player=1)
    game.board = [[1 for _ in range(8)] for _ in range(8)]
    game.board[0][0] = 0
    game.board[0][1] = 2
    game.board[1][0] = 2
    game.current_player = 1
    game._update_score()

    result = game.make_move(0)

    assert game.winner == 1
    assert result["pass_turn"]["passed"] is True
    assert result["pass_turn"]["message"] == "Both players have no legal moves. Final score decides the game."


@smoke_test
def test_reversi_game_over_scoring_draw():
    game = Reversi(starting_player=1)
    game.board = [[1 if (row + col) % 2 == 0 else 2 for col in range(8)] for row in range(8)]
    game._update_score()
    game._finish_by_score()

    assert game.score == {1: 32, 2: 32}
    assert game.winner == 0


@smoke_test
def test_reversi_ai_move_generation():
    game = Reversi(starting_player=1)

    decision = choose_reversi_ai_move(game, "medium")

    assert decision["move"] in game.get_legal_moves()
    assert decision["metadata"]["flipped_cell_count"] >= 1


if __name__ == "__main__":
    for test in SMOKE_TESTS:
        test()
    print("backend smoke tests passed")
