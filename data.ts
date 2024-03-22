import { error } from "console";
import { User } from "./types";

// represents active sessions
// map from token -> username
const SESSIONS: Record<string, string> = {
  token1: "theor",
};

// represents all registered users
// map from username -> userdata
const USERS: Record<string, User> = {
  theor: {
    username: "theor",
    password: "password",
    email: "loser@gmail.com",
    admin: true,
    following: ["jarm"],
    stats: {},
  },
  jarm: {
    username: 'jarm',
    password: 'secure',
    email: 'winner@gmail.com',
    admin: true,
    following: [],
    stats: {}
  }
};

interface GameResult {
  id: string;
  player1: string;
  player2: string;
  // if winner is undefined, the game ended in a draw
  winner?: string;
  //moves: Move[];
  date: Date;
}

// const ACTIVE_GAMES: Record<string, ActiveGame> = {

// };

const GAME_HISTORY: Record<string, GameResult> = {
  game1: {
    id: "game1",
    player1: "theor",
    player2: "jarm",
    winner: "jarm",
    date: new Date('2024-3-22')
  }, 
  game2: {
    id: "game2",
    player1: "theor",
    player2: "theor",
    date: new Date('2024-3-25')
  }
};

export interface GameSearchParameters {
  count: number;
  sort?: 'newest' | 'oldest';
  filter?: {
    players?: string[];
  }
}

// returns n game results based on filter and sort parameters
export function searchGameResults({ count, sort, filter }: GameSearchParameters): GameResult[] {
  function predicate(gameResult: GameResult): boolean {
    if (!filter?.players) {
      return true;
    }
    for (let user of filter.players) {
      if (gameResult.player1 !== user && gameResult.player2 !== user) {
        return false;
      }
    }
    return true;
  }
  function newestComparator(gameResult1: GameResult, gameResult2: GameResult): number {
    return gameResult2.date.getTime() - gameResult1.date.getTime();
  }
  const oldestComparator = (
    gameResult1: GameResult,
    gameResult2: GameResult
  ) => newestComparator(gameResult2, gameResult1);
  const comparator = sort ? {
    newest: newestComparator,
    oldest: oldestComparator
  }[sort] : () => 0;

  return Object.values(GAME_HISTORY)
    .filter(predicate)
    .sort(comparator)
    .slice(0, count);
}

// retrieve game results, undefined if game ID(s) are invalid
export function getGameResults(gameIDs: string[]): GameResult[] | undefined {
  const games: GameResult[] = [];
  for (let gameID of gameIDs) {
    if (!GAME_HISTORY[gameID]) {
      return undefined;
    }
    games.push(GAME_HISTORY[gameID]);
  }
  return games;
}

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

export function getSessionUsername(token: string) {
  if(doesSessionExist(token)){
    return SESSIONS[token]
  }
  throw Error("Session does not exist!")
}

export function getAllUserInfo(username: string) {
  if(doesUserExist(username)){
    return USERS[username]
  }
  throw Error("User does not exist!")
}

export function getPublicUserInfo(username: string) {
  const userInfo = getAllUserInfo(username)
  return {
    username: userInfo.username,
    admin: userInfo.admin,
    following: userInfo.following,
    stats: userInfo.stats,
  }
}

export function getPrivateUserInfo(username: string) {
  const userInfo = getAllUserInfo(username)
  return {
    username: userInfo.username,
    email: userInfo.email,
    admin: userInfo.admin,
    following: userInfo.following,
    stats: userInfo.stats,
  }
}

export function setUserInfo(username : string, newData: Partial<User>){
  USERS[username] = { ...(USERS[username] || []), ...newData }
}

// TODO: add game states and types
// map from gameId -> gameResult
