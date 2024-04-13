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

// add a like to the given picture id list, if the picture does not exist, create it
export async function addOneLike(id: string, username: string): Promise<void> {
  const pic = await getPicture(id);
  if (pic === false) {
    await pictureModel.create({ id: id, likes: [username] });
    return;
  }
  return await pictureModel
    .updateOne({ id: id }, { $push: { likes: username } })
    .then((res) => {});
}

// add a like to the given picture id list, if the picture does not exist, create it
export async function removeLike(id: string, username: string): Promise<void> {
  const pic = await getPicture(id);
  if (pic === false) {
    await pictureModel.create({ id: id, likes: [username] });
    return;
  }
  return await pictureModel
    .updateOne({ id: id }, { $pull: { likes: username } })
    .then((res) => {});
}
