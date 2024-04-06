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
export function destroySession(token: string): void {
  sessionModel.deleteOne({ token: token });
}

export function doesSessionExist(token: string): boolean {
  return !!sessionModel.findOne({ token: token });
}
