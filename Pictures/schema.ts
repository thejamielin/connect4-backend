import mongoose from "mongoose";
export const pictureSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    likes: { type: [String], required: true },
  },
  { collection: "pictures" }
);
