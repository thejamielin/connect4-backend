import express from "express";
import expressWs from "express-ws";
import mongoose from "mongoose";
import SessionRoutes from "./Sessions/routes";
import UserRoutes from "./Users/routes";
import PictureRoutes from "./Pictures/routes";
import cors from "cors";
import { getGameResults, GameSearchParameters, searchGameResults, createGame } from "./data";
import { getSessionUsername } from "./Sessions/dao";
import GameRoutes from "./Game/routes";

mongoose.connect("mongodb://localhost:27017/connect4");
const app = express();
app.use(cors());

app.use(express.json());
expressWs(app);

SessionRoutes(app);
UserRoutes(app);
PictureRoutes(app);
GameRoutes(app);

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
