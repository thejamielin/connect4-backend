import * as sessionsDao from "./Sessions/dao";
import { error } from "console";
import { Connect4Board } from "./connect4";
import { v4 as uuidv4 } from "uuid";
import { PictureData } from "./types";
import dotenv from "dotenv";

dotenv.config();
export const PIXBAY_API_KEY = process.env.PIXBAY_API_KEY;
export const PIXBAY_URL = "https://pixabay.com/api/";

interface CommonGameData {
  id: string;
  playerIDs: string[];
}

interface GameCreationData extends CommonGameData {
  phase: 'creation';
  readyPlayerIDs: string[];
}

export interface OngoingGameData extends CommonGameData {
  phase: 'ongoing';
  board: Connect4Board;
}

interface EndedGameData extends CommonGameData {
  phase: 'over';
  result: GameResult;
}

export type Game = GameCreationData | OngoingGameData | EndedGameData;

const GAMES: Map<string, Game> = new Map();

export function findGame(gameID: string): Game | undefined {
  return GAMES.get(gameID);
}

export function joinGame(game: Game, playerID: string): boolean {
  if (game.playerIDs.length >= 2) {
    return false;
  }
  game.playerIDs = [...game.playerIDs, playerID];
  return true;
}

export function createGame(playerID: string) {
  const game: Game = {
    id: uuidv4(),
    phase: 'creation',
    playerIDs: [playerID],
    readyPlayerIDs: []
  };
  GAMES.set(game.id, game);
}

// returns a boolean indicating whether the game is ready to start or not
export function setReady(game: GameCreationData, playerID: string) {
  const matchID = (id: string) => id === playerID;
  if (!game.playerIDs.find(matchID) || game.readyPlayerIDs.find(matchID)) {
    return false;
  }
  game.readyPlayerIDs = [...game.readyPlayerIDs, playerID];
  return game.playerIDs.length === game.readyPlayerIDs.length;
}

export function startGame(game: GameCreationData): OngoingGameData {
  const startedGame: OngoingGameData = {
    id: game.id,
    phase: 'ongoing',
    playerIDs: game.playerIDs,
    board: Connect4Board.newBoard(4, 2, 7, 6)
  };
  GAMES.set(game.id, startedGame);
  return startedGame;
}

export function validMove(game: Game, playerID: string, column: number): game is OngoingGameData {
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

export function applyMove(game: OngoingGameData, column: number) {
  Connect4Board.move(game.board, column);
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

// TODO: add game states and types
// map from gameId -> gameResult
