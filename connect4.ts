export interface Connect4Board {
  connect: number;
  playerCount: number;
  playerTurn: number;
  slots: (number | undefined)[][];
}

export namespace Connect4Board {
  export function newBoard(connect: number, players: number, width: number, height: number): Connect4Board {
    return {
      connect: connect,
      playerCount: players,
      playerTurn: 0,
      slots: Array(height).fill(undefined).map(() => Array(width).fill(undefined))
    }
  }

  // modifies the board state and return the row in which the piece lands
  export function move(board: Connect4Board, column: number): number {
    if (!canMove(board, column)) {
      throw Error('Illegal move.');
    }
    let landedRow = 0;
    for (let row = 0; row < board.slots.length; row += 1) {
      if (board.slots[row][column] !== undefined) {
        break;
      }
      landedRow = row;
    }
    board.slots[landedRow][column] = board.playerTurn;
    board.playerTurn = (board.playerTurn + 1) % board.playerCount;
    return landedRow;
  }

  export function canMove(board: Connect4Board, column: number) {
    checkColumn(board, column);
    return board.slots[0][column] === undefined;
  }

  function checkColumn(board: Connect4Board, column: number) {
    if (column < 0 || column >= board.slots[0].length) {
      throw Error('Column out of bounds.');
    }
  }
}
