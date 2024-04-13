import * as sessionsDao from "../Sessions/dao";
import { PIXBAY_API_KEY, PIXBAY_URL } from "../data";
import { PictureInfo, ApiResult } from "../types";
import * as dao from "./dao";
import axios from "axios";

export default function PictureRoutes(app: any) {
  async function formatPixbay(data: any): Promise<PictureInfo[]> {
    var apiResult = data as ApiResult;
    for (var idx in apiResult.hits) {
      var id = String(apiResult.hits[idx].id);
      apiResult.hits[idx]["likes"] = await dao.getLikes(id);
    }
    return apiResult.hits;
  }

  // get a single APIEntry representing a picture based on its id
  const findPictureById = async (req: any, res: any) => {
    const { id } = req.params;
    axios
      .get(PIXBAY_URL, { params: { key: PIXBAY_API_KEY, id: id } })
      .then(async (pixbayRes) => {
        res.status(200).send((await formatPixbay(pixbayRes.data))[0]);
      })
      .catch(() => {
        res.status(404).send("Image not found!");
      });
  };

  // get a list of APIEntries representing pictures based on a search query
  const findPicturesByQuery = async (req: any, res: any) => {
    const { q } = req.query;
    axios
      .get(PIXBAY_URL, { params: { key: PIXBAY_API_KEY, q: q } })
      .then(async (pixbayRes) => {
        res.status(200).send(await formatPixbay(pixbayRes.data));
      });
  };

  // insert a like on a specified image into "pictures" collection for the requesting user
  const addLikeToPicture = async (req: any, res: any) => {
    // TODO: validate body
    const { token } = req.body;
    const { id } = req.params;
    const username = await sessionsDao.getSessionUsername(token);
    if (username === false) {
      res.status(404).send("Invalid session!");
      return;
    }

    // TODO: validate edited fields! e.g. followers must be valid users
    dao.addOneLike(id, username);
    res.status(200).send();
  };
  app.get("/pictures/search", findPicturesByQuery);
  app.get("/pictures/:id", findPictureById);
  app.put("/pictures/like/:id", addLikeToPicture);
}
