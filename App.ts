import express from "express";
import {
  USERS,
  createNewUser,
  createSession,
  destroySession,
  doesSessionExist,
  doesUserExist,
  getSessionUsername,
  getAllUserInfo,
  isCorrectPassword,
  getPublicUserInfo,
  getPrivateUserInfo,
  setUserInfo,
} from "./data";
const app = express();

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

app.post("/account/register", (req, res) => {
  // { username: string, password: string, email: string } -> { token?: string }

  // TODO: use request body validation checker
  const { username, password, email } = req.body as AccountRegisterRequest;
  // send failed response if user creation fails due to already existing
  if (!createNewUser(username, password, email)) {
    res.status(400).send({});
    return;
  }
  const sessionID = createSession(username);
  res.send({ token: sessionID });
});

app.post("/account/login", (req, res) => {
  // { username: string, password: string } -> { token?: string }
  const { username, password } = req.body as AccountLoginRequest;
  if (isCorrectPassword(username, password)) {
    const sessionID = createSession(username);
    res.send({ token: sessionID });
  } else {
    res.status(400).send({});
  }
});

app.post("/account/logout", (req, res) => {
  // { token: string } -> {}
  const { token } = req.body;
  destroySession(token);
  res.send({});
});

app.get("/account/checkSession", (req, res) => {
  // { token: string } -> {}
  const { token } = req.body;
  if (doesSessionExist(token)) {
    res.status(200).send({});
  } else {
    res.status(400).send({});
  }
});

function isLoggedIn(req : {body: {token? : String}}) {
  const { token } = req.body
  return token === undefined
}

// TODO: Rename this lol
function isChill(token: string, username: string){
  return doesSessionExist(token) && getSessionUsername(token) === username
}

app.get("/user/:username", (req, res) => {
  const { token } = req.body
  const { username } = req.params
  if(!doesUserExist(username)){
    res.status(404).send("User does not exist!")
    return
  }
  if(isChill(token, username)){
    res.status(200).send(getPrivateUserInfo(username))
  }
  else {
    res.status(200).send(getPublicUserInfo(username))
  }
})

app.put("/user/:username", (req, res) => {
  const { token, editedFields: {following, email} } = req.body
  const { username } = req.params
  if(!doesUserExist(username)){
    res.status(404).send("User does not exist!")
    return
  }
  if(isChill(token, username)){
    setUserInfo(username, { following, email })
    res.status(200).send(getPrivateUserInfo(username))
  }
  else {
    res.status(401).send("Cannot edit other user's data!")
  }
})

app.get("/", (req, res) => {
  res.send("Welcome to Full Stack Development!");
});

console.log("Started server!");
app.listen(4000);
