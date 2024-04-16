import express from "express";
import expressWs from "express-ws";
import mongoose from "mongoose";
import SessionRoutes from "./Sessions/routes";
import UserRoutes from "./Users/routes";
import PictureRoutes from "./Pictures/routes";
import cors from "cors";
import { createGame } from "./data";
import { getSessionUsername } from "./Sessions/dao";
import GameRoutes from "./Game/routes";
import GameResultRoutes from "./GameResults/routes";

mongoose.connect("mongodb://localhost:27017/connect4");
const app = express();
app.use(cors());

app.use(express.json());
expressWs(app);

SessionRoutes(app);
UserRoutes(app);
PictureRoutes(app);
GameRoutes(app);
GameResultRoutes(app);

// create game
app.post("/game", async (req, res) => {
  if (!req.headers.authorization) {
    return res.status(403).json({ error: 'No credentials sent!' });
  }
  const token = req.headers.authorization;
  const player = await getSessionUsername(token);
  if (player === false) {
    res.status(401).send("You must be logged in to create a game.");
    return;
  }
  res.status(200).send({ gameID: createGame() });
});

app.get("/", (req, res) => {
  res.send("Welcome to Full Stack Development!");
});

console.log("Started server!");
app.listen(process.env.PORT || 4000);
