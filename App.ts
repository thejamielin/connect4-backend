import express from 'express';
import { USERS, createSession } from './data';
const app = express();

// TODO: replace temporary testing code here
app.use(express.json());

interface AccountRegisterRequest {
  username: string;
  password: string;
  email: string;
}
app.post('/account/register', (req, res) => {
  // { username: string, password: string, email: string } -> { token?: string }

  // TODO: use request body validation checker
  const {username, password, email} = req.body as AccountRegisterRequest;
  // reject registration if user already exists
  if (USERS[username]) {
    res.send({});
    return;
  }
  // create user and return sessionID
  USERS[username] = {
    username: username,
    email: email,
    following: [],
    stats: {},
    admin: false
  };
  // TODO: store password...
  const sessionID = createSession(username);
  res.send({token: sessionID});
});

app.get('/', (req, res) => {res.send('Welcome to Full Stack Development!')})




console.log('Started server!')
app.listen(4000);
