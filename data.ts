import { PrivateUser } from "./types"

// represents active sessions
// map from token -> username
export const SESSIONS: Record<string, string> = {
  'token1': 'theor'
};

// represents all registered users
// map from username -> userdata
export const USERS: Record<string, PrivateUser> = {
  'theor': {
    username: 'theor',
    email: 'loser@gmail.com',
    admin: true,
    following: ['theor'],
    stats: {

    }
  }
};

let x = 0;
// creates a session and returns the newly generated session id
export function createSession(username: string): string {
  x += 1;
  const sessionID = '' + x;
  SESSIONS[sessionID] = username;
  return sessionID;
}

// TODO: add game states and types
// map from gameId -> gameResult