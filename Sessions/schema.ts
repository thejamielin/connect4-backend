import mongoose from "mongoose";
export const sessionSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    username: { type: String, required: true },
  },
  { collection: "sessions" }
);
