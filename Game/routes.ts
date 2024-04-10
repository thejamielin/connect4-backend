import express from "express";
import { getSessionUsername } from "../Sessions/dao";
import ClientHandler from "./clientHandler";
import { GameClient } from "./clientManager";
import { ConnectionStatusCode } from "./gameTypes";

async function getUser(req: express.Request, connection: GameClient): Promise<string | undefined> {
  const { token } = req.query;
  if (token === undefined) {
    console.error('Rejecting tokenless player.');
    connection.close(ConnectionStatusCode.NOT_AUTHORIZED, 'You must be logged in to play.');
    return;
  }
  const userID = await getSessionUsername(token + ''); // TODO: retrieve player ID from token
  if (userID === false) {
    console.error('Rejecting invalid player.');
    connection.close(ConnectionStatusCode.NOT_AUTHORIZED, 'You must be logged in to play.');
    return;
  }
  return userID;
}

export default function GameRoutes(app: express.Application) {
  const router = express.Router();
  router.ws('/game/:gameID', async (ws, req) => {
    const { gameID } = req.params;
    const userID = await getUser(req, ws);
    if (userID === undefined) {
      return;
    }
    const connection = new ClientHandler(gameID, userID, ws);
    connection.initialize();
  });
  app.use("/ws", router);
}