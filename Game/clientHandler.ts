import CLIENT_MANAGER, { GameClient } from "./clientManager";
import { Connect4Board } from "./connect4";
import { joinGame, leaveGame, setReady, startGame, validMove, applyMove, findGame, setGame } from "../data";
import { ConnectionStatusCode, ServerMessage, ClientRequest, GameData, EndedGameData, GameResult } from "./gameTypes";
import * as gameResultsDao from "../GameResults/dao";
import * as userDao from "../Users/dao";

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
    const scheduledBroadcasts: ServerMessage[] = [];
    this.handleReadyMessage(game, message, scheduledBroadcasts);
    this.handleMoveMessage(game, message, scheduledBroadcasts);
    scheduledBroadcasts.forEach(broadcast => CLIENT_MANAGER.broadcastGameMessage(game, broadcast));
  }

  private handleReadyMessage(game: GameData, message: ClientRequest, scheduledBroadcasts: ServerMessage[]) {
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
    scheduledBroadcasts.push({ type: 'ready', playerID: this.userID });
    if (allReady) {
      const startedGame = startGame(game);
      scheduledBroadcasts.push({ type: 'state', gameState: startedGame });
    }
  }

  private handleMoveMessage(game: GameData, message: ClientRequest, scheduledBroadcasts: ServerMessage[]) {
    if (message.type !== 'move') {
      return;
    }
    if (game.phase !== 'ongoing') {
      return;
    }
    if (validMove(game, this.userID, message.column)) {
      applyMove(game, message.column);
      scheduledBroadcasts.push({ type: 'move', playerID: this.userID, gameState: game });
      const winningConnect = Connect4Board.findLastMoveWin(game.board);
      const resultMetaData = {
        id: game.id,
        playerIDs: game.playerIDs,
        date: new Date()
      };
      let gameResult: GameResult | false = false;
      if (winningConnect) {
        gameResult = {
          ...resultMetaData, winnerID: this.userID, winningLine: winningConnect
        };
      } else if (Connect4Board.checkBoardFull(game.board)) {
        gameResult = {
          ...resultMetaData, winnerID: false
        };
      }
      if (gameResult) {
        const endState: GameData = {
          ...resultMetaData, phase: 'over', connectedIDs: game.connectedIDs, result: gameResult
        };
        setGame(endState);
        scheduledBroadcasts.push({ type: 'state', gameState: endState });
        gameResultsDao.saveGameResult(gameResult);
        game.playerIDs.forEach(playerID => {
          userDao.getUser(playerID).then(user => {
            if (user?.role !== 'regular') {
              return;
            }
            const newStats = user.stats;
            newStats.gameIDs.push(game.id);
            if (!gameResult) {
              newStats.ties += 1;
            } else if (gameResult.winnerID === playerID) {
              newStats.wins += 1;
            } else {
              newStats.losses += 1;
            }
            userDao.setUserInfo(playerID, { stats: newStats })
          });
        });
      }
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