import * as sessionsDao from "./Sessions/dao";
import { error } from "console";
import { ImageEntry, User } from "./types";

const IMAGE_ENTRIES: Record<string, ImageEntry> = {
  794978: {
    id: "794978",
    likes: [],
  },
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

export function formatPixbay(data: any): ApiEntry[] {
  var apiResult = data as ApiResult;
  for (var idx in apiResult.hits) {
    var id = String(apiResult.hits[idx].id);
    apiResult.hits[idx]["likes"] = IMAGE_ENTRIES[id]?.likes || [];
  }
  return apiResult.hits;
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

export function setImageLikes(id: string, username: string) {
  if (!IMAGE_ENTRIES[id]) {
    IMAGE_ENTRIES[id] = { id: id, likes: [] };
  }
  IMAGE_ENTRIES[id].likes = [...(IMAGE_ENTRIES[id]?.likes || []), username];
}

// TODO: add game states and types
// map from gameId -> gameResult
