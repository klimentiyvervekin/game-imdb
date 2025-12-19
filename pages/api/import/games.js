import { dbConnect } from "../../../db/connect";
import Game from "../../../db/models/Game";

// this file imports games from the RAWG API
// it creates new games or updates existing ones using externalId

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    await dbConnect();

    const apiKey = process.env.RAWG_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "RAWG_API_KEY is not set in .env.local" });
    }

    const pageSize = Number(req.query.page_size || 20); // if we have in url 50 games it will be taken. if not than it will be only 20 taken

    // response of game list
    const listUrl = `https://api.rawg.io/api/games?key=${apiKey}&page_size=${pageSize}`;
    const listResp = await fetch(listUrl); // that means "rawg pls give me gamelist"

    if (!listResp.ok) {
      const text = await listResp.text();
      return res
        .status(502)
        .json({ error: "RAWG request failed", details: text.slice(0, 300) });
    } // "if rawg answer with error then do this"

    const listData = await listResp.json();
    const results = listData.results ?? [];

    let upserted = 0;

    // if we have game - update game, if not - create game
    for (const g of results) {
      const externalId = g.id;

      // response for details of game
      const detailsUrl = `https://api.rawg.io/api/games/${externalId}?key=${apiKey}`;
      const detailsResp = await fetch(detailsUrl);

      // if detail response okay, put json
      let details = null;
      if (detailsResp.ok) {
        details = await detailsResp.json();
      }

      const title = g.name;
      const slug = g.slug;
      const coverUrl = g.background_image || null;

      // optional infos for 5 mvp ticket
      const releaseDate = details?.released
        ? new Date(details.released)
        : undefined;

      const developer =
        Array.isArray(details?.developers) && details.developers.length > 0
          ? details.developers[0].name
          : undefined;

      const publisher =
        Array.isArray(details?.publishers) && details.publishers.length > 0
          ? details.publishers[0].name
          : undefined;

      // this means if platforms is array we transform every object in "platform.name"
      const platforms = Array.isArray(details?.platforms)
        ? details.platforms.map((p) => p?.platform?.name).filter(Boolean)
        : undefined;

      const description = (details?.description_raw || "").trim() || undefined;

      const score =
        typeof details?.metacritic === "number"
          ? details.metacritic
          : undefined;

      const stores = Array.isArray(details?.stores)
        ? details.stores.map((s) => s?.store?.name).filter(Boolean)
        : undefined;

      const screenshotsCount =
        typeof details?.screenshots_count === "number"
          ? details.screenshots_count
          : undefined;

      const videosCount =
        typeof details?.movies_count === "number"
          ? details.movies_count
          : undefined;

      // down means "note this in mongodb (model game)"
      await Game.findOneAndUpdate(
        { externalId },
        {
          externalId,
          title,
          slug,
          coverUrl,
          releaseDate,
          developer,
          publisher,
          platforms,
          description,
          score,
          stores,
          screenshotsCount,
          videosCount,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true } // upsert: true means "if didnt found then create new", new: true means "return updated thing",
      );

      upserted += 1;
    } // for each loop ends here

    return res.status(200).json({
      importedFromRawg: results.length,
      upserted,
      note: "Details fetched via /games/{id} for extra fields",
    });
  } catch (error) {
    console.error("IMPORT ERROR:", error);
    return res.status(500).json({ error: error.message, name: error.name });
  }
}
