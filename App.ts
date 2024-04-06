import express from "express";
import mongoose from "mongoose";
import SessionRoutes from "./Sessions/routes";
import UserRoutes from "./Users/routes";
import * as sessionsDao from "./Sessions/dao";
import cors from "cors";
import dotenv from "dotenv";
import {
  createNewUser,
  doesUserExist,
  getSessionUsername,
  getPublicUserInfo,
  getPrivateUserInfo,
  setUserInfo,
  getGameResults,
  searchGameResults,
  GameSearchParameters,
  setImageLikes,
  ApiResult,
  formatPixbay,
} from "./data";
import axios from "axios";
dotenv.config();

const PIXBAY_API_KEY = process.env.PIXBAY_API_KEY;
const PIXBAY_URL = "https://pixabay.com/api/";
mongoose.connect("mongodb://localhost:27017/connect4");
const app = express();
app.use(cors());

// TODO: replace temporary testing code here
app.use(express.json());

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

app.post("/account/register", (req, res) => {
  // { username: string, password: string, email: string } -> { token?: string }

  // TODO: use request body validation checker
  const { username, password, email } = req.body as AccountRegisterRequest;
  // send failed response if user creation fails due to already existing
  if (!createNewUser(username, password, email)) {
    res.status(400).send({});
    return;
  }
  const sessionID = sessionsDao.createSession(username);
  res.send({ token: sessionID });
});

app.post("/account/logout", (req, res) => {
  // { token: string } -> {}
  // TODO: validate body
  const { token } = req.body;
  sessionsDao.destroySession(token);
  res.send({});
});

app.post("/account/checkSession", (req, res) => {
  // { token: string } -> {}
  // TODO: validate body
  const { token } = req.body;
  if (sessionsDao.doesSessionExist(token)) {
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

// TODO: Rename this lol
function isChill(token: string, username: string) {
  return (
    sessionsDao.doesSessionExist(token) &&
    getSessionUsername(token) === username
  );
}

// GET function, used post because we didn't want to reformat the body (TODO: change this?)
app.post("/user/:username", (req, res) => {
  // TODO: validate body
  const { token } = req.body;
  const { username } = req.params;
  if (!doesUserExist(username)) {
    res.status(404).send("User does not exist!");
    return;
  }
  if (isChill(token, username)) {
    res.status(200).send(getPrivateUserInfo(username));
  } else {
    res.status(200).send(getPublicUserInfo(username));
  }
});

app.put("/user/:username", (req, res) => {
  // TODO: validate body
  const {
    token,
    editedFields: { following, email, pfp },
  } = req.body;
  const { username } = req.params;
  if (!doesUserExist(username)) {
    res.status(404).send("User does not exist!");
    return;
  }
  if (isChill(token, username)) {
    // TODO: validate edited fields! e.g. followers must be valid users
    setUserInfo(username, { following, email, pfp });
    res.status(200).send(getPrivateUserInfo(username));
  } else {
    res.status(401).send("Cannot edit other user's data!");
  }
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

app.get("/pictures/search", (req, res) => {

  const { q } = req.query
  axios.get(PIXBAY_URL, {params: {key: PIXBAY_API_KEY, q: q}}).then((pixbayRes) => {
    res.status(200).send(formatPixbay(pixbayRes.data))
  })
})

app.get("/pictures/id", (req, res) => {
  const { id } = req.query
  axios.get(PIXBAY_URL, {params: {key: PIXBAY_API_KEY, id: id}}).then((pixbayRes) => {
    res.status(200).send(formatPixbay(pixbayRes.data))
  }).catch(() => {res.status(404).send("Image not found!")})
})

app.put("/pictures/like/:id", (req, res) => {
  // TODO: validate body
  const { token } = req.body
  const { id } = req.params
  if(!sessionsDao.doesSessionExist(token)){
    res.status(404).send("Invalid session!")
    return
  }
  const username = getSessionUsername(token)
  // TODO: validate edited fields! e.g. followers must be valid users
  setImageLikes(id, username)
  res.status(200).send()
})

app.get("/", (req, res) => {
  res.send("Welcome to Full Stack Development!");
});

console.log("Started server!");
app.listen(4000);
