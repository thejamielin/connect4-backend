export interface Connect4Board {
  connect: number;
  playerCount: number;
  playerTurn: number;
  slots: (number | false)[][];
  lastMove?: Connect4Board.ExecutedMove;
}

export namespace Connect4Board {
  export interface ExecutedMove {
    playerIndex: number;
    row: number;
    column: number;
  }

  export function newBoard(connect: number, players: number, width: number, height: number): Connect4Board {
    return {
      connect: connect,
      playerCount: players,
      playerTurn: 0,
      slots: Array(height).fill(0).map(() => Array(width).fill(false))
    }
  }

  // modifies the board state and return the executed move
  export function move(board: Connect4Board, column: number) {
    if (!canMove(board, column)) {
      throw Error('Illegal move.');
    }
    let landedRow = 0;
    for (let row = 0; row < board.slots.length; row += 1) {
      if (board.slots[row][column] !== false) {
        break;
      }
      landedRow = row;
    }
    const playerIndex = board.playerTurn;
    board.slots[landedRow][column] = playerIndex;
    board.playerTurn = (board.playerTurn + 1) % board.playerCount;
    board.lastMove = { playerIndex, column, row: landedRow };
  }

  export function canMove(board: Connect4Board, column: number): boolean {
    if (column < 0 || column >= board.slots[0].length) {
      return false;
    }
    return board.slots[0][column] === false;
  }

  export function findLastMoveWin(board: Connect4Board): [number, number][] | undefined {
    if (!board.lastMove) {
      return undefined;
    }
    const directions = [[1, 0], [0, 1], [1, 1]];
    const [originCol, originRow] = [board.lastMove.column, board.lastMove.row];
    const playerPiece = board.slots[originRow][originCol] as number;
    for (let [colDir, rowDir] of directions) {
      let inARow: [number, number][] = [[originRow, originCol]];
      [1, -1].forEach(sign => {
        let distance = 1;
        const offShoot: [number, number][] = [];
        while (true) {
          const [col, row] = [originCol + colDir * sign * distance, originRow + rowDir * sign * distance];
          if (!inBounds(board, row, col) || board.slots[row][col] !== playerPiece) {
            break;
          }
          distance += 1;
          offShoot.push([row, col]);
        }
        inARow = sign === 1 ? [...inARow, ...offShoot] : [...offShoot.reverse(), ...inARow];
      });
      if (inARow.length >= board.connect) {
        return inARow;
      }
    }
    return undefined;
  }

  export function checkBoardFull(board: Connect4Board): boolean {
    return board.slots.findIndex(row => row.findIndex(slot => slot === false) !== -1) === -1;
  }

  export function inBounds(board: Connect4Board, row: number, col: number): boolean {
    return row >= 0 && row < board.slots.length && col >= 0 && col < board.slots[0].length;
  }
}
