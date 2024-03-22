import { User } from "./types";

// represents active sessions
// map from token -> username
export const SESSIONS: Record<string, string> = {
  token1: "theor",
};

// represents all registered users
// map from username -> userdata
export const USERS: Record<string, User> = {
  theor: {
    username: "theor",
    password: "password",
    email: "loser@gmail.com",
    admin: true,
    following: ["theor"],
    stats: {},
  },
};

let x = 0;
// creates a session and returns the newly generated session id
export function createSession(username: string): string {
  x += 1;
  const sessionID = "" + x;
  SESSIONS[sessionID] = username;
  return sessionID;
}

export function destroySession(token: string): void {
  delete SESSIONS[token];
}

export function doesSessionExist(token: string): boolean {
  return !!SESSIONS[token];
}

// determines if the given username already exists in the database
export function doesUserExist(username: string): boolean {
  return !!USERS[username];
}

// determines if the given password is correctly associated with the given username
export function isCorrectPassword(username: string, password: string): boolean {
  return doesUserExist(username) && USERS[username].password === password;
}

// creates a new user, returns true on success and false if the user already exists
export function createNewUser(
  username: string,
  password: string,
  email: string
): boolean {
  // fails if the user already exists
  if (doesUserExist(username)) {
    return false;
  }

  USERS[username] = {
    username: username,
    password: password,
    email: email,
    following: [],
    stats: {},
    admin: false,
  };
  return true;
}

// TODO: add game states and types
// map from gameId -> gameResult
