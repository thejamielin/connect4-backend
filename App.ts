import express from 'express';
import { USERS, createSession } from './data';
const app = express();

// TODO: replace temporary testing code here
app.use(express.json());

app.post('/account/register', (req, res) => {
  // TODO: use request body validation checker
  // { username: string, password: string, email: string } -> { token?: string }

  // reject registration if user already exists
  const username = req.body['username'];
  if (USERS[username]) {
    res.send({});
    return;
  }
  // create user and return sessionID
  USERS[username] = {
    username: username,
    email: req.body['email'],
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
