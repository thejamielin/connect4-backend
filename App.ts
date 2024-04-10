import express from "express";
import expressWs, { WebsocketRequestHandler } from "express-ws";
import mongoose from "mongoose";
import SessionRoutes from "./Sessions/routes";
import UserRoutes from "./Users/routes";
import PictureRoutes from "./Pictures/routes";
import cors from "cors";
import { Connect4Board } from "./connect4";
import { findGame, joinGame, setReady, getGameResults, GameSearchParameters, searchGameResults, startGame, validMove, applyMove, createGame, leaveGame } from "./data";
import { getSessionUsername } from "./Sessions/dao";
import { ConnectionStatusCode, ServerMessage, ClientRequest, GameData } from "./gameTypes";
import ClientManager from "./clientManager";

mongoose.connect("mongodb://localhost:27017/connect4");
const app = express();
app.use(cors());

app.use(express.json());
expressWs(app);


const CLIENT_MANAGER = new ClientManager();

const router = express.Router();

router.ws('/game/:gameID', async (ws, req) => {
  const { gameID } = req.params;
  const { token } = req.query;
  if (token === undefined) {
    console.error('Rejecting tokenless player.');
    ws.close(ConnectionStatusCode.NOT_AUTHORIZED, 'You must be logged in to play.');
    return;
  }
  const userID = await getSessionUsername(token + ''); // TODO: retrieve player ID from token
  if (userID === false) {
    console.error('Rejecting invalid player.');
    ws.close(ConnectionStatusCode.NOT_AUTHORIZED, 'You must be logged in to play.');
    return;
  }

  function accessGame(): GameData | undefined {
    const game = findGame(gameID);
    if (!game) {
      console.error('Rejecting player', userID, 'connecting to invalid game', gameID);
      ws.close(ConnectionStatusCode.NOT_FOUND, 'This game does not exist.');
      return undefined;
    }
    return game;
  }

  // close connection if game doesn't exist
  const game = accessGame();
  if (!game) {
    return;
  }
  // if (game.playerIDs.find(id => id === playerID) !== undefined) {
  //   console.error('Rejecting player', playerID, 'who already joined', gameID);
  //   ws.close(ConnectionStatusCode.REDUNDANT_CONNECTION, 'This player is already in the game.');
  //   return;
  // }
  console.log('Player', userID, 'joining', gameID, 'with players', JSON.stringify(game.connectedIDs));
  if (!joinGame(game, userID)) {
    console.error('Rejecting player', userID, 'from full game', gameID);
    ws.close(ConnectionStatusCode.GAME_FULL, 'Game is full.');
    return;
  }
  // store the established connection
  CLIENT_MANAGER.storeConnection(game, userID, ws);
  ws.on('close', () => {
    const game = accessGame();
    if (!game) {
      return;
    }
    leaveGame(game, userID);
    CLIENT_MANAGER.broadcastGameMessage(game, { type: 'leave', playerID: userID });
  });

  console.log('Player', userID, 'joined game', gameID, 'with players', JSON.stringify(game.connectedIDs));

  const initialStateMessage: ServerMessage = { type: 'state', gameState: game };
  ws.send(JSON.stringify(initialStateMessage));

  CLIENT_MANAGER.broadcastGameMessage(game, { type: 'join', playerID: userID });
  
  ws.on('message', data => {
    const game = accessGame();
    if (!game) {
      return;
    }
    const message: ClientRequest = JSON.parse(data.toString());
    if (message.type === 'ready') {
      if (game.phase !== 'creation') {
        return;
      }
      if (game.readyIDs.find(id => id === userID) !== undefined) {
        return;
      }
      const allReady = setReady(game, userID);
      CLIENT_MANAGER.broadcastGameMessage(game, { type: 'ready', playerID: userID });
      if (allReady) {
        const startedGame = startGame(game);
        CLIENT_MANAGER.broadcastGameMessage(game, { type: 'state', gameState: startedGame });
      }
    } else if (message.type === 'move') {
      if (validMove(game, userID, message.column)) {
        applyMove(game, message.column);
        CLIENT_MANAGER.broadcastGameMessage(game, { type: 'move', playerID: userID, gameState: game });
        const winningConnect = Connect4Board.findLastMoveWin(game.board);
        if (winningConnect) {
          CLIENT_MANAGER.broadcastGameMessage(game, { type: 'gameover', result: { winnerID: userID, line: winningConnect}});
        } else if (Connect4Board.checkBoardFull(game.board)) {
          CLIENT_MANAGER.broadcastGameMessage(game, { type: 'gameover', result: { winnerID: false }});
        }
        // TODO: handle game cleanup and ending
      } else {
        // TODO: handle misbehaving clients?
      }
    }
  });
  ws.on('close', () => {
    // TODO: handle closing here or something?
    console.error('Closing socket for player', userID);
  });
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
