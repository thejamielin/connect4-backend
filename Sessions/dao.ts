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
  await sessionModel.deleteOne({ token: token })
}

export async function doesSessionExist(token: string) : Promise<boolean> {
  return await sessionModel.findOne({ token: token }).then((session) => {
    return (session !== null)
  })
}
