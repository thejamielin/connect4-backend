import { Connect4Board } from "./connect4";

export interface CommonGameData {
  id: string;
  connectedIDs: string[];
}

export interface GameCreationData extends CommonGameData {
  phase: 'creation';
  readyIDs: string[];
}

export interface OngoingGameData extends CommonGameData {
  phase: 'ongoing';
  board: Connect4Board;
  playerIDs: string[];
}

export interface EndedGameData extends CommonGameData {
  phase: 'over';
  result: GameResult;
}

export type GameResult = {
  id: string;
  playerIDs: string[];
  date: Date;
} & (
  {
    winnerID: false;
  } | {
    winnerID: string;
    winningLine: [number, number][];
  }
);

export type GameData = GameCreationData | OngoingGameData | EndedGameData;

export type ClientRequest = {
  type: 'ready';
} | {
  type: 'move';
  column: number;
} | {
  type: 'chat';
  message: string;
};

export type ServerMessage = {
  type: 'state';
  gameState: GameData
} | {
  type: 'join';
  playerID: string;
} | {
  type: 'ready';
  playerID: string;
} | {
  type: 'move';
  playerID: string;
  gameState: OngoingGameData
} |  {
  type: 'chat';
  messages: {
    playerID: string;
    text: string;
  }[];
} | {
  type: 'leave';
  playerID: string;
}

// TODO: implement games closing if no activity for some time w/ creation timestamp
export enum ConnectionStatusCode {
  NOT_FOUND = 4004,
  NOT_AUTHORIZED = 4001,
  GAME_FULL = 4003,
  GAME_ALREADY_STARTED = 4002,
  REDUNDANT_CONNECTION = 4008
}
