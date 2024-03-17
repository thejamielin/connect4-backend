import express from 'express';
import { USERS, createNewUser, createSession } from './data';
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
  // send failed response if user creation fails due to already existing
  if (!createNewUser(username, password, email)) {
    res.status(400).send({});
    return;
  }
  const sessionID = createSession(username);
  res.send({token: sessionID});
});

app.get('/', (req, res) => {res.send('Welcome to Full Stack Development!')})




console.log('Started server!')
app.listen(4000);
