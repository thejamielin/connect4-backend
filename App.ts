import express from "express";
import expressWs from "express-ws";
import mongoose from "mongoose";
import SessionRoutes from "./Sessions/routes";
import UserRoutes from "./Users/routes";
import PictureRoutes from "./Pictures/routes";
import cors from "cors";
import { Connect4Board } from "./connect4";
import { findGame, joinGame, setReady, getGameResults, GameSearchParameters, searchGameResults, startGame, validMove, applyMove, createGame, leaveGame } from "./data";
import { getSessionUsername } from "./Sessions/dao";
import { ConnectionStatusCode, ServerMessage, ClientRequest, GameData } from "./gameTypes";
import ClientManager, { GameClient } from "./clientManager";

mongoose.connect("mongodb://localhost:27017/connect4");
const app = express();
app.use(cors());

app.use(express.json());
expressWs(app);


const CLIENT_MANAGER = new ClientManager();

const router = express.Router();

async function getUser(req: express.Request, connection: GameClient): Promise<string | undefined> {
  const { token } = req.query;
  if (token === undefined) {
    console.error('Rejecting tokenless player.');
    connection.close(ConnectionStatusCode.NOT_AUTHORIZED, 'You must be logged in to play.');
    return;
  }
  const userID = await getSessionUsername(token + ''); // TODO: retrieve player ID from token
  if (userID === false) {
    console.error('Rejecting invalid player.');
    connection.close(ConnectionStatusCode.NOT_AUTHORIZED, 'You must be logged in to play.');
    return;
  }
  return userID;
}

class ConnectionHandler {
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

router.ws('/game/:gameID', async (ws, req) => {
  const { gameID } = req.params;
  const userID = await getUser(req, ws);
  if (userID === undefined) {
    return;
  }
  const connection = new ConnectionHandler(gameID, userID, ws);
  connection.initialize();
});

app.use("/ws", router);

SessionRoutes(app);
UserRoutes(app);
PictureRoutes(app);

// create game
app.post("/game", async (req, res) => {
  const { token } = req.body;
  const player = await getSessionUsername(token);
  if (player === false) {
    res.status(401).send("You must be logged in to create a game.");
    return;
  }
  res.status(200).send({ gameID: createGame() });
});

app.get("/games", (req, res) => {
  // { gameIDs: string[] } => GameResult[]
  // TODO: validate body
  const { gameIDs } = req.body;
  const gameResults = getGameResults(gameIDs);
  if (!gameResults) {
    res.status(404).send("Invalid game IDs");
    return;
  }
  res.status(200).send(gameResults);
});

app.post("/games/search", (req, res) => {
  // TODO: validate body
  const searchParams: GameSearchParameters = req.body;
  if (searchParams.count < 0 || searchParams.count > 100) {
    res.status(400).send("Pwease use a vawid numba of games >~<");
  }
  res.status(200).send(searchGameResults(searchParams));
});

app.get("/", (req, res) => {
  res.send("Welcome to Full Stack Development!");
});

console.log("Started server!");
app.listen(4000);
