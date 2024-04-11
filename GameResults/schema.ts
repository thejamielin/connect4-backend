import mongoose from "mongoose";
export const gameResultSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    player1: { type: String, required: true },
    player2: { type: String, required: true },
    winner: { type: String },
    date: { type: Date, required: true },
  },
  { collection: "gameResults" }
);
