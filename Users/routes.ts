import * as sessionsDao from "../Sessions/dao";
import { AccountRegisterRequest, User } from "../types";
import * as usersDao from "../Users/dao";
import { RegularUser, BeginnerUser } from "../types";

export default function UserRoutes(app: any) {
  const findUserByUsername = async (req: any, res: any) => {
    // TODO: validate body
    if (!req.headers.authorization) {
      return res.status(403).json({ error: 'No credentials sent!' });
    }
    const token = req.headers.authorization;
    const { username } = req.params;
    const doesUserExist = await usersDao.getUser(username);
    if (!doesUserExist) {
      res.status(404).send("User does not exist!");
      return;
    }
    const chill = await isChill(token, username);
    if (chill) {
      const data = await usersDao.getPrivateUserInfo(username);
      res.status(200).send(data);
    } else {
      const data = await usersDao.getPublicUserInfo(username);
      res.status(200).send(data);
    }
  };
  const updateUser = async (req: any, res: any) => {
    // TODO: validate body
    if (!req.headers.authorization) {
      return res.status(403).json({ error: 'No credentials sent!' });
    }
    const token = req.headers.authorization;
    const { editedFields } = req.body.body as {
      editedFields:
        | Partial<Pick<RegularUser, "email" | "pfp" | "following">>
        | Partial<Pick<BeginnerUser, "email">>;
    };
    const username = await sessionsDao.getSessionUsername(token);
    if (username === false) {
      res.status(404).send("Invalid Session!");
      return;
    }

    // TODO: validate edited fields! e.g. followers must be valid users
    usersDao.setUserInfo(username, editedFields);
    res.status(200).send({ success: true });
  };
  const register = async (req: any, res: any) => {
    // { username: string, password: string, email: string } -> { token?: string }

    // TODO: use request body validation checker
    const { username, password, email, isBeginner } =
      req.body as AccountRegisterRequest;
    // send failed response if user creation fails due to already existing
    if (
      !(await usersDao.createNewUser(username, password, email, isBeginner))
    ) {
      res.status(409).send("User already exists");
      return;
    }
    const sessionID = sessionsDao.createSession(username);
    res.send({ token: sessionID });
  };
  app.get("/user/:username", findUserByUsername);
  app.put("/user", updateUser);
  app.post("/account/register", register);

  // Helper functions
  // Checks if the given token exists and is associated with the given user
  async function isChill(token: string, username: string) {
    return (await sessionsDao.getSessionUsername(token)) === username;
  }
}
