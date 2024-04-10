import CLIENT_MANAGER, { GameClient } from "./clientManager";
import { Connect4Board } from "./connect4";
import { joinGame, leaveGame, setReady, startGame, validMove, applyMove, findGame } from "../data";
import { ConnectionStatusCode, ServerMessage, ClientRequest, GameData } from "./gameTypes";

export default class ClientHandler {
  gameID: string;
  userID: string;
  connection: GameClient;
  constructor(gameID: string, userID: string, connection: GameClient) {
    this.gameID = gameID;
    this.userID = userID;
    this.connection = connection;
  }

  initialize() {
    if (!this.handshakeConnection()) {
      return;
    }
    this.connection.on('close', () => this.onClose());
    this.broadcastJoinNotification();
    this.connection.on('message', data => this.onMessage(JSON.parse(data.toString())));
  }

  private handshakeConnection(): boolean {
    // close connection if game doesn't exist
    const game = this.accessGame();
    if (!game) {
      return false;
    }
    console.log('Player', this.userID, 'joining', this.gameID, 'with players', JSON.stringify(game.connectedIDs));
    if (!joinGame(game, this.userID)) {
      console.error('Rejecting player', this.userID, 'from full game', this.gameID);
      this.connection.close(ConnectionStatusCode.GAME_FULL, 'Game is full.');
      return false;
    }
    // store the established connection
    CLIENT_MANAGER.storeConnection(game, this.userID, this.connection);
    return true;
  }

  private onClose() {
    const game = this.accessGame();
    if (!game) {
      return;
    }
    leaveGame(game, this.userID);
    CLIENT_MANAGER.broadcastGameMessage(game, { type: 'leave', playerID: this.userID });
  }

  private broadcastJoinNotification() {
    const game = this.accessGame();
    if (!game) {
      return;
    }
  
    const initialStateMessage: ServerMessage = { type: 'state', gameState: game };
    this.connection.send(JSON.stringify(initialStateMessage));

    CLIENT_MANAGER.broadcastGameMessage(game, { type: 'join', playerID: this.userID });
  }

  private onMessage(message: ClientRequest) {
    const game = this.accessGame();
    if (!game) {
      return;
    }
    this.handleReadyMessage(game, message);
    this.handleMoveMessage(game, message);
  }

  private handleReadyMessage(game: GameData, message: ClientRequest) {
    if (message.type !== 'ready') {
      return;
    }
    if (game.phase !== 'creation') {
      return;
    }
    // skip if the user is already ready
    if (game.readyIDs.find(id => id === this.userID) !== undefined) {
      return;
    }
    const allReady = setReady(game, this.userID);
    CLIENT_MANAGER.broadcastGameMessage(game, { type: 'ready', playerID: this.userID });
    if (allReady) {
      const startedGame = startGame(game);
      CLIENT_MANAGER.broadcastGameMessage(game, { type: 'state', gameState: startedGame });
    }
  }

  private handleMoveMessage(game: GameData, message: ClientRequest) {
    if (message.type !== 'move') {
      return;
    }
    if (validMove(game, this.userID, message.column)) {
      applyMove(game, message.column);
      CLIENT_MANAGER.broadcastGameMessage(game, { type: 'move', playerID: this.userID, gameState: game });
      const winningConnect = Connect4Board.findLastMoveWin(game.board);
      if (winningConnect) {
        CLIENT_MANAGER.broadcastGameMessage(game, { type: 'gameover', result: { winnerID: this.userID, line: winningConnect}});
      } else if (Connect4Board.checkBoardFull(game.board)) {
        CLIENT_MANAGER.broadcastGameMessage(game, { type: 'gameover', result: { winnerID: false }});
      }
      // TODO: handle game cleanup and ending
    } else {
      // TODO: handle misbehaving clients?
    }
  }

  private accessGame(): GameData | undefined {
    const game = findGame(this.gameID);
    if (!game) {
      console.error('Rejecting player', this.userID, 'connecting to invalid game', this.gameID);
      this.connection.close(ConnectionStatusCode.NOT_FOUND, 'This game does not exist.');
      return undefined;
    }
    return game;
  }
}