import mongoose from "mongoose";
import { userSchema, sessionSchema } from "./schema";
export const userModel = mongoose.model("UserModel", userSchema);
