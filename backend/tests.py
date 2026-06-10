from backend.game.ai import choose_ai_move
from backend.game.connect4 import ConnectFour


def test_medium_ai_takes_winning_move():
    game = ConnectFour(starting_player=1)
    game.board[5][0] = 1
    game.board[5][1] = 1
    game.board[5][2] = 1

    decision = choose_ai_move(game, "medium")

    assert decision["move"] == 3


def test_medium_ai_blocks_immediate_threat():
    game = ConnectFour(starting_player=1)
    game.board[5][0] = 2
    game.board[5][1] = 2
    game.board[5][2] = 2

    decision = choose_ai_move(game, "medium")

    assert decision["move"] == 3


def test_hard_ai_prefers_center_opening():
    game = ConnectFour(starting_player=1)

    decision = choose_ai_move(game, "hard")

    assert decision["move"] == 3


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
