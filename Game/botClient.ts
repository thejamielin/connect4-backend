import { createSession, destroySession } from "../Sessions/dao";
import { Connect4Board } from "./connect4";
import { ClientRequest, GameData, ServerMessage } from "./gameTypes";
import WebSocket from "ws";

const SERVER_SOCKET_BASE_URL = process.env.SERVER_SOCKET_BASE_URL;
const BOT_NAME = "bot";
const botClients: Set<WebSocket> = new Set();

export function createBotClient(gameID: string) {
  const token = createSession(BOT_NAME);
  const client = new WebSocket(
    `${SERVER_SOCKET_BASE_URL}/${gameID}?token=${token}`
  );
  botClients.add(client);

  let state: GameData | false = false;
  client.on("open", () => {
    console.log("Bot joined the game.");
  });
  client.on("close", (e) => {
    console.log("Bot connection closed");
    destroySession(token);
    botClients.delete(client);
  });
  client.on("error", (error) => {
    console.error("Bot error:", error);
  });
  client.on("message", (serverMessage) => {
    const message: ServerMessage = JSON.parse(serverMessage.toString());
    if (message.type === "join") {
      const chatRequest: ClientRequest = {
        type: "chat",
        message: `Hello there, ${message.playerID}!`,
      };
      client.send(JSON.stringify(chatRequest));
    } else if (message.type === "leave") {
      const chatRequest: ClientRequest = {
        type: "chat",
        message: `Bye bye, ${message.playerID}!`,
      };
      client.send(JSON.stringify(chatRequest));
    } else if (message.type === "ready") {
      if (message.playerID === BOT_NAME) {
        return;
      }
      const readyRequest: ClientRequest = { type: "ready" };
      client.send(JSON.stringify(readyRequest));
    } else if (message.type === "state") {
      state = message.gameState;
    } else if (message.type === "move") {
      state = message.gameState;
      const currentTurn = state.playerIDs[state.board.playerTurn];
      if (currentTurn === BOT_NAME) {
        const possibleMoves: number[] = [];
        for (
          let column = 0;
          column < state.board.slots[0].length;
          column += 1
        ) {
          if (Connect4Board.canMove(state.board, column)) {
            possibleMoves.push(column);
          }
        }
        const moveRequest: ClientRequest = {
          type: "move",
          column:
            possibleMoves[Math.floor(Math.random() * possibleMoves.length)],
        };
        setTimeout(() => client.send(JSON.stringify(moveRequest)), 1000);
      }
    } else if (message.type === "chat") {
      if (message.messages[message.messages.length - 1].text === "fuck u") {
        const chatRequest: ClientRequest = { type: "chat", message: "fuck u" };
        client.send(JSON.stringify(chatRequest));
      }
    }
  });
}
