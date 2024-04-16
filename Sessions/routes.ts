import * as dao from "./dao";
import * as usersDao from "../Users/dao";

interface AccountLoginRequest {
  username: string;
  password: string;
}

export default function SessionRoutes(app: any) {
  const login = async (req: any, res: any) => {
    const { username, password } = req.body as AccountLoginRequest;
    const isCorrect = await dao.isCorrectPassword(username, password);
    if (isCorrect) {
      const sessionID = dao.createSession(username);
      res.send({ token: sessionID });
    } else {
      res.status(400).send({});
    }
  };
  const logout = async (req: any, res: any) => {
    // { token: string } -> {}
    // TODO: validate body
    if (!req.headers.authorization) {
      return res.status(403).json({ error: 'No credentials sent!' });
    }
    const token = req.headers.authorization;
    dao.destroySession(token);
    res.send({});
  };

  const getUserData = async (req: any, res: any) => {
    // { token: string } -> { username: string }
    if (!req.headers.authorization) {
      return res.status(403).json({ error: 'No credentials sent!' });
    }
    const token = req.headers.authorization;
    const username = await dao.getSessionUsername(token);
    if (username === false) {
      res.status(404).send("Invalid token");
      return;
    } else {
      const data = await usersDao.getPrivateUserInfo(username)
      res.status(200).send(data);
    }
  };
  
  app.post("/account/login", login);
  app.post("/account/logout", logout);
  app.get("/account", getUserData);
}
