import * as sessionsDao from "../Sessions/dao";
import { User } from "../types";
import * as usersDao from "../Users/dao";

let currentUser = null;
export default function UserRoutes(app: any) {
  // Checks if the given token exists and is associated with the given user
  async function isChill(token: string, username: string) {
    return (
      (await sessionsDao.getSessionUsername(token)) === username
    );
  }

  async function getPublicUserInfo(username: string) {
    const userInfo = await usersDao.getUser(username);
    if(!userInfo){
      throw Error("User does not exits")
    }
    return {
      username: userInfo.username,
      beginner: userInfo.beginner,
      following: userInfo.following,
      stats: userInfo.stats,
    };
  }
  
  async function getPrivateUserInfo(username: string) {
    const userInfo = await usersDao.getUser(username);
    if(!userInfo){
      throw Error("User does not exits")
    }
    return {
      username: userInfo.username,
      email: userInfo.email,
      beginner: userInfo.beginner,
      following: userInfo.following,
      stats: userInfo.stats,
    };
  }

  const createUser = async (req: any, res: any) => {};
  const findAllUsers = async (req: any, res: any) => {};
  const findUserByUsername = async (req: any, res: any) => {
    // TODO: validate body
    const { token } = req.body;
    const { username } = req.params;
    const doesUserExist = await usersDao.getUser(username)
    if (!doesUserExist) {
      res.status(404).send("User does not exist!");
      return;
    }
    const chill = await isChill(token, username)
    if (chill) {
      const data = await getPrivateUserInfo(username);
      res.status(200).send(data)
    } else {
      const data = await getPublicUserInfo(username)
      res.status(200).send(data);
    }
  };
  const updateUser = async (req: any, res: any) => {
    // TODO: validate body
    const {
      token,
      editedFields
    } = req.body as {
      token: string,
      editedFields: Partial<Pick<User, 'email' | 'pfp' | 'following'>>
    };
    const username = await sessionsDao.getSessionUsername(token)
    if(username === false){
      res.status(404).send("Invalid Session!");
      return
    }

    // TODO: validate edited fields! e.g. followers must be valid users
    usersDao.setUserInfo(username, editedFields);
    res.status(200).send(await getPrivateUserInfo(username));
  };
  const register = async (req: any, res: any) => {
  };
  app.post("/user/:username", findUserByUsername);
  app.put("/user/:username", updateUser);
  app.post("/account/register", register);
}

