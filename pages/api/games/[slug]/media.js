import { dbConnect } from "../../../../db/connect";
import Game from "../../../../db/models/Game";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const apiKey = process.env.RAWG_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "RAWG_API_KEY is not set" });
    }

    const { slug } = req.query;
    const game = await Game.findOne({ slug });

    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    const id = game.externalId;

    // screenshots
    const screenshotsUrl = `https://api.rawg.io/api/games/${id}/screenshots?key=${apiKey}&page_size=24`;
    const screenshotsResp = await fetch(screenshotsUrl);

    // movies (videos)
    const moviesUrl = `https://api.rawg.io/api/games/${id}/movies?key=${apiKey}&page_size=10`;
    const moviesResp = await fetch(moviesUrl);

    if (!screenshotsResp.ok || !moviesResp.ok) {
      return res.status(502).json({ error: "RAWG media request failed" });
    }

    const screenshotsData = await screenshotsResp.json();
    const moviesData = await moviesResp.json();

    const screenshots =
      (screenshotsData.results || [])
        .map((s) => s.image)
        .filter(Boolean);

    const videos =
      (moviesData.results || [])
        .map((m) => ({
          name: m.name,
          preview: m.preview,
          url: m.data?.max || m.data?.["480"],
        }))
        .filter((v) => v.url);

    return res.status(200).json({
      slug,
      title: game.title,
      screenshots,
      videos,
    });
  } catch (error) {
    console.error("MEDIA ERROR:", error);
    return res.status(500).json({ error: error.message, name: error.name });
  }
}
