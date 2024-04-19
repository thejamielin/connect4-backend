import { createSession, destroySession } from "../Sessions/dao";
import { Connect4Board } from "./connect4";
import { ClientRequest, GameData, ServerMessage } from "./gameTypes";

const SERVER_SOCKET_BASE_URL = "ws://localhost:4000/ws";
const BOT_NAME = 'bot';
const botClients: Set<WebSocket> = new Set();

export function createBotClient(gameID: string) {
  const token = createSession(BOT_NAME);
  const client = new WebSocket(`${SERVER_SOCKET_BASE_URL}/${gameID}?token=${token}`);
  botClients.add(client);
  
  let state: GameData | false = false;
  client.onopen = () => {
    
  };
  client.onclose = () => {
    destroySession(token);
    botClients.delete(client);
  }
  client.onmessage = serverMessage => {
    const message: ServerMessage = JSON.parse(serverMessage.data);
    if (message.type === 'join') {
      const chatRequest: ClientRequest = {
        type: 'chat',
        message: `Hello there, ${message.playerID}!`
      }
      client.send(JSON.stringify(chatRequest));
    } else if (message.type === 'leave') {
      const chatRequest: ClientRequest = {
        type: 'chat',
        message: `Bye bye, ${message.playerID}!`
      }
      client.send(JSON.stringify(chatRequest));
    } else if (message.type === 'ready') {
      if (message.playerID === BOT_NAME) {
        return;
      }
      const readyRequest: ClientRequest = { type: 'ready' };
      client.send(JSON.stringify(readyRequest));
    } else if (message.type === 'state') {
      state = message.gameState;
    } else if (message.type === 'move') {
      state = message.gameState;
      const currentTurn = state.playerIDs[state.board.playerTurn];
      if (currentTurn === BOT_NAME) {
        const possibleMoves: number[] = [];
        for (let column = 0; column < state.board.slots[0].length; column += 1) {
          if (Connect4Board.canMove(state.board, column)) {
            possibleMoves.push(column);
          }
        }
        const moveRequest: ClientRequest = {
          type: 'move',
          column: possibleMoves[Math.floor(Math.random() * possibleMoves.length)]
        };
        client.send(JSON.stringify(moveRequest));
      }
    } else if (message.type === 'chat') {
      if (message.messages[message.messages.length - 1].text === 'fuck u') {
        const chatRequest: ClientRequest = { type: 'chat', message: 'fuck u' };
        client.send(JSON.stringify(chatRequest));
      }
    }
  }
}