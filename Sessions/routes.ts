import * as dao from "./dao";

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
    const { token } = req.body;
    dao.destroySession(token);
    res.send({});
  };
  const checkSession = async (req: any, res: any) => {
    // { token: string } -> {}
    // TODO: validate body
    const { token } = req.body;
    const doesExist = await dao.doesSessionExist(token);
    if (doesExist) {
      res.status(200).send({
        isValidSession: true,
      });
    } else {
      res.status(200).send({
        isValidSession: false,
      });
    }
  };
  const getUsername = async (req: any, res: any) => {
    // { token: string } -> { username: string }
    const { token } = req.body;
    const username = await dao.getSessionUsername(token);
    if (username === false) {
      res.status(404).send("Invalid token");
      return;
    } else {
      res.status(200).send({ username: username });
    }
  };
  app.post("/account/login", login);
  app.post("/account/logout", logout);
  app.post("/account/checkSession", checkSession);
  // TODO change to get
  app.post("/account", getUsername);
}
