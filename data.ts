import * as sessionsDao from "./Sessions/dao";
import { error } from "console";
import { Connect4Board } from "./Game/connect4";
import { v4 as uuidv4 } from "uuid";
import { PictureStats } from "./types";
import dotenv from "dotenv";
import { GameData, GameCreationData, OngoingGameData } from "./Game/gameTypes";

dotenv.config();
export const PIXBAY_API_KEY = process.env.PIXBAY_API_KEY;
export const PIXBAY_URL = "https://pixabay.com/api/";

const GAMES: Map<string, GameData> = new Map();

export function findGame(gameID: string): GameData | undefined {
  return GAMES.get(gameID);
}

export function joinGame(game: GameData, userID: string): boolean {
  game.connectedIDs = [...game.connectedIDs, userID];
  return true;
}

export function leaveGame(game: GameData, userID: string): boolean {
  if (game.connectedIDs.find((id) => id === userID) === undefined) {
    return false;
  }
  game.connectedIDs = game.connectedIDs.filter((id) => id !== userID);
  if (game.phase === "creation") {
    game.readyIDs = game.readyIDs.filter((id) => id !== userID);
  }
  return true;
}

export function createGame(): string {
  const game: GameData = {
    id: uuidv4(),
    phase: "creation",
    connectedIDs: [],
    readyIDs: [],
  };
  GAMES.set(game.id, game);
  return game.id;
}

// returns a boolean indicating whether the game is ready to start or not
export function setReady(game: GameCreationData, userID: string) {
  const matchID = (id: string) => id === userID;
  if (!game.connectedIDs.find(matchID) || game.readyIDs.find(matchID)) {
    return false;
  }
  game.readyIDs = [...game.readyIDs, userID];
  return game.connectedIDs.length === game.readyIDs.length;
}

export function startGame(game: GameCreationData): OngoingGameData {
  const startedGame: OngoingGameData = {
    id: game.id,
    phase: "ongoing",
    connectedIDs: game.connectedIDs,
    playerIDs: game.readyIDs,
    board: Connect4Board.newBoard(4, game.readyIDs.length, 7, 6),
  };
  GAMES.set(game.id, startedGame);
  return startedGame;
}

export function validMove(
  game: GameData,
  playerID: string,
  column: number
): game is OngoingGameData {
  // game must be ongoing
  if (game.phase !== "ongoing") {
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

// const ACTIVE_GAMES: Record<string, ActiveGame> = {

// };

// TODO: add game states and types
// map from gameId -> gameResult
