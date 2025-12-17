import { dbConnect } from "../../../db/connect";
import Game from "../../../db/models/Game";

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

    const url = `https://api.rawg.io/api/games?key=${apiKey}&page_size=${pageSize}`;
    const response = await fetch(url); // that means "rawg pls give me gamelist"

    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({
        error: "RAWG request failed",
        status: response.status,
        details: text.slice(0, 300),
      });
    } // "if rawg answer with error then do this"

    const data = await response.json();
    const results = data.results ?? [];

    let upserted = 0;

    // if we have game - update game, if not - create game
    for (const g of results) {
      const externalId = g.id;
      const title = g.name;
      const slug = g.slug;
      const coverUrl = g.background_image || null;

      const doc = await Game.findOneAndUpdate(
        { externalId }, // find a game with externalId
        { externalId, title, slug, coverUrl }, // if game found then update
        { upsert: true, new: true, setDefaultsOnInsert: true } // if not found create new
      );

      if (doc) upserted += 1; // if everything ok do +1
    }

    return res.status(200).json({
      importedFromRawg: results.length,
      upserted,
    });
  } catch (error) {
    console.error("IMPORT ERROR:", error);
    return res.status(500).json({ error: error.message, name: error.name });
  }
}

// this file imports games from the RAWG API
// it creates new games or updates existing ones using externalId
