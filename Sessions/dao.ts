import { getUser } from "../Users/dao";
import { User } from "../types";
import { sessionModel } from "./model";
import { v4 as uuidv4 } from "uuid";
// creates a session and returns the newly generated session id
export function createSession(username: string): string {
  const newSession = {
    token: uuidv4(),
    username: username,
  };
  sessionModel.create(newSession);
  return newSession.token;
}
export async function destroySession(token: string) {
  await sessionModel.deleteOne({ token: token });
}

export async function doesSessionExist(token: string): Promise<boolean> {
  const maybeUsername = await getSessionUsername(token);
  return !!maybeUsername;
}

// determines if the given password is correctly associated with the given username
export async function isCorrectPassword(
  username: string,
  password: string
): Promise<boolean> {
  const user = await getUser(username);
  return !!user && user.password === password;
}

export function getSessionUsername(
  token: string
): Promise<string | false> {
  return sessionModel.findOne({ token: token }).then((session) => {
    console.log(token, session)
    if (session === null) {
      return false;
    }
    return session["username"];
  });
}
