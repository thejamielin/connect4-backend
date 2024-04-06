import mongoose from "mongoose";
import { sessionSchema } from "./schema";
export const sessionModel = mongoose.model("SessionModel", sessionSchema);
