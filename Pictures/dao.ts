import { PictureData } from "../types";
import { pictureModel } from "./model";

export async function getPicture(id: string): Promise<PictureData | false> {
  return await pictureModel.findOne({ id: id }).then((pic) => {
    if (pic === null) {
      return false;
    }
    return pic as PictureData;
  });
}

export async function getLikes(id: string): Promise<string[]> {
  return await getPicture(id).then((pic) => {
    if (pic === false) {
      return [];
    }
    return pic.likes;
  });
}

export async function addOneLike(id: string, username: string): Promise<void> {
  return await pictureModel
    .updateOne({ id: id }, { $push: { likes: username } })
    .then((res) => {});
}
