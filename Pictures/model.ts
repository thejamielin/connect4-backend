import mongoose from "mongoose";
import { pictureSchema } from "./schema";
export const pictureModel = mongoose.model("PictureModel", pictureSchema);
