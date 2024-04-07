import * as sessionsDao from "./Sessions/dao";
import { error } from "console";
import { ImageEntry, User } from "./types";
import { Connect4Board } from "./connect4";
import { v4 as uuidv4 } from "uuid";

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
    beginner: true,
    following: ["jarm"],
    stats: {},
  },
  jarm: {
    username: "jarm",
    password: "secure",
    email: "winner@gmail.com",
    beginner: true,
    following: [],
    stats: {},
  },
};

const IMAGE_ENTRIES: Record<string, ImageEntry> = {
  794978: {
    id: '794978',
    likes: [],
  }
}

interface CommonGameData {
  id: string;
  playerIDs: string[];
}

interface GameCreationData extends CommonGameData {
  phase: 'creation';
  readyPlayerIDs: string[];
}

interface OngoingGameData extends CommonGameData {
  phase: 'ongoing';
  board: Connect4Board;
}

interface EndedGameData extends CommonGameData {
  phase: 'over';
  result: GameResult;
}

type Game = GameCreationData | OngoingGameData | EndedGameData;

const GAMES: Map<string, Game> = new Map();

function getGame(gameID: string): Game | undefined {
  return GAMES.get(gameID);
}

function createGame(playerID: string) {
  const game: Game = {
    id: uuidv4(),
    phase: 'creation',
    playerIDs: [playerID],
    readyPlayerIDs: []
  };
  GAMES.set(game.id, game);
}

function setReady(game: GameCreationData, playerID: string) {
  const matchID = (id: string) => id === playerID;
  if (!game.playerIDs.find(matchID) || game.readyPlayerIDs.find(matchID)) {
    return;
  }
  game.readyPlayerIDs = [...game.readyPlayerIDs, playerID];
  if (game.playerIDs.length === game.readyPlayerIDs.length) {
    startGame(game);
  }
}

function startGame(game: GameCreationData) {
  const startedGame: OngoingGameData = {
    id: game.id,
    phase: 'ongoing',
    playerIDs: game.playerIDs,
    board: Connect4Board.newBoard(4, 2, 7, 6)
  };
  GAMES.set(game.id, startedGame);
}

function validMove(game: Game, playerID: string, column: number): game is OngoingGameData {
  // game must be ongoing
  if (game.phase !== 'ongoing') {
    return false;
  }
  // it must be this player's turn
  if (game.playerIDs[game.board.playerTurn] !== playerID) {
    return false;
  }
  // the player's move must be legal
  if (!Connect4Board.canMove(game.board, column)) {
    return false;
  }
  return true;
}

interface ExecutedMove {
  playerIndex: number;
  row: number;
  column: number;
}

function applyMove(game: OngoingGameData, column: number): ExecutedMove {
  const playerIndex = game.board.playerTurn;
  const row = Connect4Board.move(game.board, column);
  return { playerIndex, row, column };
}

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
    date: new Date("2024-3-22"),
  },
  game2: {
    id: "game2",
    player1: "theor",
    player2: "theor",
    date: new Date("2024-3-25"),
  },
};

export interface GameSearchParameters {
  count: number;
  sort?: "newest" | "oldest";
  filter?: {
    players?: string[];
  };
}

export interface ApiEntry {
  id: number;
  previewURL: string;
  webformatURL: string;
  views: number;
  downloads: number;
  user: string;
  tags: string;
  likes: string[];
}
export interface ApiResult {
  total: number;
  totalHits: number;
  hits: ApiEntry[];
}

export function formatPixbay(data : any) : ApiEntry[] {
  var apiResult = data as ApiResult
  for(var idx in apiResult.hits) {
    var id = String(apiResult.hits[idx].id)
    apiResult.hits[idx]["likes"] = IMAGE_ENTRIES[id]?.likes || []
  }
  return apiResult.hits
}

// returns n game results based on filter and sort parameters
export function searchGameResults({
  count,
  sort,
  filter,
}: GameSearchParameters): GameResult[] {
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
  function newestComparator(
    gameResult1: GameResult,
    gameResult2: GameResult
  ): number {
    return gameResult2.date.getTime() - gameResult1.date.getTime();
  }
  const oldestComparator = (gameResult1: GameResult, gameResult2: GameResult) =>
    newestComparator(gameResult2, gameResult1);
  const comparator = sort
    ? {
        newest: newestComparator,
        oldest: oldestComparator,
      }[sort]
    : () => 0;

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
    beginner: false,
  };
  return true;
}

export async function getSessionUsername(token: string) {
  if (await sessionsDao.doesSessionExist(token)) {
    return SESSIONS[token];
  }
  throw Error("Session does not exist!");
}

export function getAllUserInfo(username: string) {
  if (doesUserExist(username)) {
    return USERS[username];
  }
  throw Error("User does not exist!");
}

export function getPublicUserInfo(username: string) {
  const userInfo = getAllUserInfo(username);
  return {
    username: userInfo.username,
    beginner: userInfo.beginner,
    following: userInfo.following,
    stats: userInfo.stats,
  };
}

export function getPrivateUserInfo(username: string) {
  const userInfo = getAllUserInfo(username);
  return {
    username: userInfo.username,
    email: userInfo.email,
    beginner: userInfo.beginner,
    following: userInfo.following,
    stats: userInfo.stats,
  };
}

export function setUserInfo(username: string, newData: Partial<User>) {
  USERS[username] = { ...(USERS[username] || []), ...newData };
}

export function setImageLikes(id : string, username : string){
  if(!IMAGE_ENTRIES[id]){
    IMAGE_ENTRIES[id] = {id: id, likes: []}
  }
  IMAGE_ENTRIES[id].likes = [ ...(IMAGE_ENTRIES[id]?.likes || []), username]
}

// TODO: add game states and types
// map from gameId -> gameResult
