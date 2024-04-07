import express from "express";
import mongoose from "mongoose";
import SessionRoutes from "./Sessions/routes";
import UserRoutes from "./Users/routes";
import * as sessionsDao from "./Sessions/dao";
import * as usersDao from "./Users/dao";
import cors from "cors";
import dotenv from "dotenv";
import {
  getGameResults,
  searchGameResults,
  GameSearchParameters,
  setImageLikes,
  ApiResult,
  formatPixbay,
} from "./data";
import axios from "axios";
import { User } from "./types";
import { getSessionUsername } from "./Sessions/dao";
dotenv.config();

const PIXBAY_API_KEY = process.env.PIXBAY_API_KEY;
const PIXBAY_URL = "https://pixabay.com/api/";
mongoose.connect("mongodb://localhost:27017/connect4");
const app = express();
app.use(cors());

app.use(express.json());

interface AccountLoginRequest {
  username: string;
  password: string;
}

interface AuthRequest {
  token: string;
}

SessionRoutes(app);
UserRoutes(app);

app.post("/account/checkSession", async (req, res) => {
  // { token: string } -> {}
  // TODO: validate body
  const { token } = req.body;
  const doesExist = await sessionsDao.doesSessionExist(token);
  if (doesExist) {
    res.status(200).send({
      isValidSession: true,
    });
  } else {
    res.status(200).send({
      isValidSession: false,
    });
  }
});

function isLoggedIn(req: { body: { token?: String } }) {
  const { token } = req.body;
  return token === undefined;
}

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

app.get("/pictures/search", (req, res) => {
  const { q } = req.query;
  axios
    .get(PIXBAY_URL, { params: { key: PIXBAY_API_KEY, q: q } })
    .then((pixbayRes) => {
      res.status(200).send(formatPixbay(pixbayRes.data));
    });
});

app.get("/pictures/id", (req, res) => {
  const { id } = req.query;
  axios
    .get(PIXBAY_URL, { params: { key: PIXBAY_API_KEY, id: id } })
    .then((pixbayRes) => {
      res.status(200).send(formatPixbay(pixbayRes.data));
    })
    .catch(() => {
      res.status(404).send("Image not found!");
    });
});

app.put("/pictures/like/:id", async (req, res) => {
  // TODO: validate body
  const { token } = req.body;
  const { id } = req.params;
  const username = await getSessionUsername(token);
  if (username === false) {
    res.status(404).send("Invalid session!");
    return;
  }

  // TODO: validate edited fields! e.g. followers must be valid users
  setImageLikes(id, username);
  res.status(200).send();
});

app.get("/", (req, res) => {
  res.send("Welcome to Full Stack Development!");
});

console.log("Started server!");
app.listen(4000);
