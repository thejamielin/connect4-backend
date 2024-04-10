import { User } from "../types";
import { userModel } from "./model";

export async function getUser(username: string): Promise<User | undefined> {
  return await userModel.findOne({ username: username }).then((user) => {
    if (user === null) {
      return;
    }
    return user as User;
  });
}

// creates a new user, returns true on success and false if the user already exists
export async function createNewUser(
  username: string,
  password: string,
  email: string,
  isBeginner: boolean
): Promise<boolean> {
  const userExists = await getUser(username);
  // fails if the user already exists
  if (userExists) {
    return false;
  }
  var newUser: User;

  if (isBeginner) {
    newUser = {
      username: username,
      password: password,
      email: email,
      role: "beginner",
    };
  } else {
    newUser = {
      username: username,
      password: password,
      email: email,
      following: [],
      stats: {},
      role: "regular",
    };
  }

  await userModel.create(newUser);
  return true;
}

export async function setUserInfo(username: string, newData: Partial<User>) {
  await userModel.updateOne({ username: username }, { $set: newData });
}

export async function getPublicUserInfo(username: string) {
  const userInfo = await getUser(username);
  if (!userInfo) {
    throw Error("User does not exits");
  }
  if (userInfo.role === "beginner") {
    return {
      username: userInfo.username,
      role: userInfo.role,
    };
  } else {
    return {
      username: userInfo.username,
      following: userInfo.following,
      stats: userInfo.stats,
      pfp: userInfo.pfp,
      role: userInfo.role,
    };
  }
}

export async function getPrivateUserInfo(username: string) {
  const userInfo = await getUser(username);
  if (!userInfo) {
    throw Error("User does not exits");
  }
  if (userInfo.role === "beginner") {
    return {
      username: userInfo.username,
      role: userInfo.role,
      email: userInfo.email,
    };
  }
  return {
    username: userInfo.username,
    email: userInfo.email,
    following: userInfo.following,
    stats: userInfo.stats,
    pfp: userInfo.pfp,
    role: userInfo.role,
  };
}
