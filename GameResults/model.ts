import mongoose from "mongoose";
import { gameResultSchema } from "./schema";
export const gameResultModel = mongoose.model(
  "GameResultModel",
  gameResultSchema
);
