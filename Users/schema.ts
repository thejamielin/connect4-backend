import mongoose from "mongoose";

export const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String },
    role: { type: String, required: true },
    following: { type: [String], required: false },
    stats: { type: Object, required: false },
    pfp: { type: String },
  },
  { collection: "users" }
);
