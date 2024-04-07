import mongoose from "mongoose";
export const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String },
    isBeginner: { type: Boolean, required: true },
    following: { type: [String], required: true },
    stats: { type: Object, required: true },
    pfp: { type: String },
  },
  { collection: "users" }
);
