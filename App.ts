import express from "express";
import expressWs, { WebsocketRequestHandler } from "express-ws";
import mongoose from "mongoose";
import SessionRoutes from "./Sessions/routes";
import UserRoutes from "./Users/routes";
import PictureRoutes from "./Pictures/routes";
import cors from "cors";
import { Connect4Board } from "./connect4";
import { Game, findGame, joinGame, setReady, getGameResults, GameSearchParameters, searchGameResults, startGame, validMove, applyMove, OngoingGameData, createGame } from "./data";
import { getSessionUsername } from "./Sessions/dao";

mongoose.connect("mongodb://localhost:27017/connect4");
const app = express();
app.use(cors());

app.use(express.json());
expressWs(app);

type ClientRequest = {
  type: 'ready';
} | {
  type: 'move';
  column: number;
} | {
  type: 'chat';
  message: string;
};

type ServerMessage = {
  type: 'state';
  gameState: Game
} | {
  type: 'join';
  playerID: string;
} | {
  type: 'ready';
  playerID: string;
} | {
  type: 'move';
  playerID: string;
  gameState: OngoingGameData
} | {
  type: 'gameover';
  result: {
    winnerID: string;
    line: [number, number][];
  } | {
    winnerID: false;
  }
} | {
  type: 'chat';
  messages: {
    playerID: string;
    text: string;
  }[];
}

// TODO: implement games closing if no activity for some time w/ creation timestamp
enum ConnectionStatusCode {
  NOT_FOUND = 4004,
  NOT_AUTHORIZED = 4001,
  GAME_FULL = 4003,
  GAME_ALREADY_STARTED = 4002,
  REDUNDANT_CONNECTION = 4008
}

type GameClients = Map<string, Parameters<WebsocketRequestHandler>[0]>;
const GAME_CLIENT_GROUPS: Map<string, GameClients> = new Map();
function storeConnection(game: Game, playerID: string, connection: Parameters<WebsocketRequestHandler>[0]) {
  let gameClients = GAME_CLIENT_GROUPS.get(game.id);
  if (!gameClients) {
    gameClients = new Map();
    GAME_CLIENT_GROUPS.set(game.id, gameClients);
  }
  gameClients.get(playerID)?.close(ConnectionStatusCode.REDUNDANT_CONNECTION);
  gameClients.set(playerID, connection);
  connection.on('close', () => {
    const gameClients = GAME_CLIENT_GROUPS.get(game.id);
    gameClients?.delete(playerID);
    if (gameClients?.size === 0) {
      GAME_CLIENT_GROUPS.delete(game.id);
    }
  })
}

function broadcastGameMessage(game: Game, message: ServerMessage) {
  const gameClients = GAME_CLIENT_GROUPS.get(game.id);
  if (!gameClients) {
    return;
  }
  gameClients.forEach(client => client.send(JSON.stringify(message)));
}

const router = express.Router();

router.ws('/game/:gameID', async (ws, req) => {
  console.log('everytddy')
  const { gameID } = req.params;
  const { token } = req.query;
  if (token === undefined) {
    ws.close(ConnectionStatusCode.NOT_AUTHORIZED, 'You must be logged in to play.');
    return;
  }
  console.log('token')
  const playerID = await getSessionUsername(token + ''); // TODO: retrieve player ID from token
  if (playerID === false) {
    ws.close(ConnectionStatusCode.NOT_AUTHORIZED, 'You must be logged in to play.');
    return;
  }
  console.log('ds dandy')

  function accessGame(): Game | undefined {
    const game = findGame(gameID);
    if (!game) {
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
  if (!joinGame(game, playerID)) {
    ws.close(ConnectionStatusCode.GAME_FULL, 'Game is full.');
    return;
  }
  // store the established connection
  storeConnection(game, playerID, ws);
  console.log('everything dandy')
  const initialStateMessage: ServerMessage = { type: 'state', gameState: game };
  ws.send(JSON.stringify({initialStateMessage}))
  console.log('send initial state')

  broadcastGameMessage(game, { type: 'join', playerID });
  
  console.log('broad')
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
      const allReady = setReady(game, playerID);
      broadcastGameMessage(game, { type: 'ready', playerID });
      if (allReady) {
        const startedGame = startGame(game);
        broadcastGameMessage(game, { type: 'state', gameState: startedGame });
      }
    } else if (message.type === 'move') {
      if (validMove(game, playerID, message.column)) {
        applyMove(game, message.column);
        broadcastGameMessage(game, { type: 'move', playerID, gameState: game });
        const winningConnect = Connect4Board.findLastMoveWin(game.board);
        if (winningConnect) {
          broadcastGameMessage(game, { type: 'gameover', result: { winnerID: playerID, line: winningConnect}});
        } else if (Connect4Board.checkBoardFull(game.board)) {
          broadcastGameMessage(game, { type: 'gameover', result: { winnerID: false }});
        }
        // TODO: handle game cleanup and ending
      } else {
        // TODO: handle misbehaving clients?
      }
    }
  });
  ws.on('close', () => {
    // TODO: handle closing here or something?
    
  });
});

app.use("/ws", router);

interface AccountRegisterRequest {
  username: string;
  password: string;
  email: string;
}

interface AccountLoginRequest {
  username: string;
  password: string;
}

interface AuthRequest {
  token: string;
}

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
  res.status(200).send({ gameID: createGame(player) });
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
