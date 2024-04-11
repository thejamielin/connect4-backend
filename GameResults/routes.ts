import * as dao from "./dao";
import { GameSearchParameters } from "./dao";

export default function GameResultRoutes(app: any) {
  async function findGamesByIds(req: any, res: any) {
    // { gameIDs: string[] } => GameResult[]
    // TODO: validate body
    const { gameIDs } = req.body;
    const gameResults = await dao.getGameResults(gameIDs);
    if (!gameResults) {
      res.status(404).send("Invalid game IDs");
      return;
    }
    res.status(200).send(gameResults);
  }
  async function findGamesBySearch(req: any, res: any) {
    // TODO: validate body
    const searchParams: GameSearchParameters = req.body;
    if (searchParams.count < 0 || searchParams.count > 100) {
      res.status(400).send("Pwease use a vawid numba of games >~<");
    }
    res.status(200).send(await dao.searchGameResults(searchParams));
  }
  app.get("/games", findGamesByIds);
  app.post("/games/search", findGamesBySearch);
}
