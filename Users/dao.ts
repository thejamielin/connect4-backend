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

  const newUser: User = {
    username: username,
    password: password,
    email: email,
    following: [],
    stats: {},
    isBeginner: isBeginner,
  };

  await userModel.create(newUser);
  return true;
}

export async function setUserInfo(username: string, newData: Partial<User>) {
  await userModel.updateOne({ username: username }, { $set: newData });
}
