import mongoose, { Schema } from "mongoose";
export const gameResultSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    playerIDs: { type: [String], required: true },
    date: { type: Date, required: true },
    winnerID: { type: Schema.Types.Mixed, required: true },
    winningLine: { type: [[Number, Number]] }
  },
  { collection: "gameResults" }
);
