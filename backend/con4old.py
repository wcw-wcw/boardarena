import numpy as np

board = []
history = []
isFull = []
turnCount = 0
setTurn = 1 #for player 1
playGame = True
winner = None
move = -1

def check_win(board, row, col, player): #Checks win based on last move
    directions = [
        (0, 1),   # horizontal
        (1, 0),   # vertical
        (1, 1),   # diagonal \
        (1, -1)   # diagonal /
    ]

    for dr, dc in directions:
        count = 1

        r, c = row + dr, col + dc
        while 0 <= r < 6 and 0 <= c < 7 and board[r][c] == player:
            count += 1
            r += dr
            c += dc

        r, c = row - dr, col - dc
        while 0 <= r < 6 and 0 <= c < 7 and board[r][c] == player:
            count += 1
            r -= dr
            c -= dc

        if count >= 4:
            return True

    return False

def get_move(board, move, isFull): #Checks if move is valid
    while move < 0 or move > 6 or move in isFull: #Checks if input is valid and column is not full
        try: #Checks for invalid characters
            move = int(input("Enter move: 1-7 ")) - 1 #Get move
        except:
            print("Invalid move")
    return move

def make_move(board, move, isFull, setTurn):
    row = -1
    for i in reversed(range(6)): #Counts from bottom up
        if board[i][move] == 0:
            board[i][move] = setTurn
            row = i
            break
    else:
        isFull.append(move) #Marks column as full
    return row

print('----------\n CONNECT 4\n----------\n') #game init
board = np.zeros((6,7), dtype=int)   # init board 6 rows, 7 columns

goesFirst = input("Is player one going first? (y) for yes ")# choose who goes first
if goesFirst == 'y':
    setTurn = 1
else:
    setTurn = 2

while playGame: #Game start
    turnCount += 1
    print(board)
    print(history)
    print(f"Turn Number: {turnCount}\nIt is Player {setTurn}'s turn!")

    move = -1 #get move
    move = get_move(board, move, isFull)

    history.append({"Turn":turnCount,"Player": setTurn,"Move": move})#move history

    placed_row = -1 #Makes move unless column is full.
    placed_row = make_move(board, move, isFull, setTurn)

    if placed_row != -1 and check_win(board, placed_row, move, setTurn): #Check win
        winner = setTurn
        playGame = False
        break
    
    if np.all(board != 0): #Checks if board is full
        print("It's a draw!")
        playGame = False
        break

    if setTurn == 1: #Turn swap
        setTurn = 2
    else:
        setTurn = 1

    ff = input("Forfeit game? (y) for yes ") #FF for testing
    if ff == 'y':
        playGame = False
        winner = 2 if setTurn == 1 else 1

if winner is not None: #Declares winner
    print(board)
    print(f"Player {winner} Wins!!!")