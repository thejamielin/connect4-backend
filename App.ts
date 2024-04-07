import express from "express";
import expressWs, { WebsocketRequestHandler } from "express-ws";
import mongoose from "mongoose";
import SessionRoutes from "./Sessions/routes";
import UserRoutes from "./Users/routes";
import PictureRoutes from "./Pictures/routes";
import cors from "cors";
import { Connect4Board } from "./connect4";
import { Game, findGame, joinGame, setReady, getGameResults, GameSearchParameters, searchGameResults } from "./data";

mongoose.connect("mongodb://localhost:27017/connect4");
const app = express();
app.use(cors());

app.use(express.json());

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
  type: 'ready';
  playerIDs: string[];
} | {
  type: 'move';
  playerID: string;
  move: Connect4Board.ExecutedMove;
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

const CLIENTS: Map<string, Parameters<WebsocketRequestHandler>[0]> = new Map();

expressWs(app).app.ws('/game/:gameID', (ws, req) => {
  ws.on('open', () => {
    const { gameID } = req.params;
    const { authorization: token } = req.headers;
    if (token === undefined) {
      return;
    }
    const playerID = ''; // TODO: retrieve player ID from token

    function accessGame(): Game | undefined {
      const game = findGame(gameID);
      if (!game) {
        ws.close(4000, 'This game does not exist.');
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
      ws.close(4001, 'Game is full.');
      return;
    }
    // store the established connection
    CLIENTS.get(token)?.close();
    CLIENTS.set(token, ws);
    
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
        setReady(game, playerID);
        // TODO: relay message to game players
      }
    });
    ws.on('close', () => {
      CLIENTS.delete(token);
    })
  });
});

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
