import { WebsocketRequestHandler } from "express-ws";
import { ConnectionStatusCode, GameData, ServerMessage } from "./gameTypes";

type GameClient = Parameters<WebsocketRequestHandler>[0];

export default class ClientManager {
  clientGroups: Map<string, Map<string, GameClient>>;
  constructor() {
    this.clientGroups = new Map();
  }

  storeConnection(game: GameData, userID: string, connection: GameClient) {
    this.addConnectionToClientGroup(game, userID, connection);
    this.cleanupConnectionOnClose(game.id, userID, connection);
  }

  broadcastGameMessage(game: GameData, message: ServerMessage) {
    const gameClients = this.clientGroups.get(game.id);
    if (!gameClients) {
      return;
    }
    gameClients.forEach(client => client.send(JSON.stringify(message)));
  }

  private addConnectionToClientGroup(game: GameData, userID: string, connection: GameClient) {
    let gameClients = this.clientGroups.get(game.id);
    if (!gameClients) {
      gameClients = new Map();
      this.clientGroups.set(game.id, gameClients);
    }
    gameClients.get(userID)?.close(ConnectionStatusCode.REDUNDANT_CONNECTION);
    gameClients.set(userID, connection);
  }

  private cleanupConnectionOnClose(gameID: string, userID: string, connection: GameClient) {
    connection.on('close', () => {
      const gameClients = this.clientGroups.get(gameID);
      if (!gameClients) {
        return;
      }
      gameClients.delete(userID);
      if (gameClients.size === 0) {
        this.clientGroups.delete(gameID);
      }
    })
  }
}