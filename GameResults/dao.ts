import { GameResult } from "../Game/gameTypes";
import { gameResultModel } from "./model";

export interface GameSearchParameters {
  count: number;
  sort?: "newest" | "oldest";
  filter?: {
    players?: string[];
  };
}

async function getSingleGameResult(
  gameID: string
): Promise<GameResult | false> {
  return await gameResultModel.findOne({ id: gameID }).then((game) => {
    if (game === null) {
      return false;
    }
    return game as GameResult;
  });
}

// retrieve game results, undefined if game ID(s) are invalid
export async function getGameResults(
  gameIDs: string[]
): Promise<GameResult[] | undefined> {
  const games: GameResult[] = [];
  for (let gameID of gameIDs) {
    const game = await getSingleGameResult(gameID);
    if (!game) {
      return undefined;
    }
    games.push(game);
  }
  return games;
}

// returns n game results based on filter and sort parameters
export async function searchGameResults({
  count,
  sort,
  filter,
}: GameSearchParameters): Promise<GameResult[]> {
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

  const gameResults: GameResult[] = await gameResultModel.find();
  return Object.values(gameResults)
    .filter(predicate)
    .sort(comparator)
    .slice(0, count);
}

export async function saveGameResult(gameResult: GameResult): Promise<void> {
  await gameResultModel.create(gameResult);
}
