from game.connect4 import ConnectFour
from game.ai import get_random_ai_move


def get_human_move(game):
    while True:
        try:
            move = int(input("Enter move (1-7): ")) - 1
            if game.is_valid_move(move):
                return move
            print("That column is full or invalid.")
        except ValueError:
            print("Please enter a number from 1 to 7.")


def choose_starting_player():
    goes_first = input("Is player one going first? (y for yes): ").strip().lower()
    return 1 if goes_first == "y" else 2


def choose_mode():
    print("\nChoose a game mode:")
    print("1. Player vs Player")
    print("2. Player vs AI")
    print("3. AI vs AI")

    while True:
        choice = input("Enter choice: ").strip()
        if choice in {"1", "2", "3"}:
            return choice
        print("Invalid choice.")


def main():
    print("----------")
    print(" CONNECT 4")
    print("----------")

    mode = choose_mode()
    starting_player = choose_starting_player()
    game = ConnectFour(starting_player=starting_player)

    while game.winner is None:
        print()
        game.print_board()
        print(f"History: {game.history}")
        print(f"Player {game.current_player}'s turn")

        if mode == "1":
            move = get_human_move(game)

        elif mode == "2":
            if game.current_player == 1:
                move = get_human_move(game)
            else:
                move = get_random_ai_move(game)
                print(f"AI chooses column {move + 1}")

        else:  # mode == "3"
            move = get_random_ai_move(game)
            print(f"AI Player {game.current_player} chooses column {move + 1}")

        result = game.make_move(move)

        if result["winner"] is not None:
            break

    print()
    game.print_board()

    if game.winner == 0:
        print("It's a draw!")
    else:
        print(f"Player {game.winner} wins!")


if __name__ == "__main__":
    main()