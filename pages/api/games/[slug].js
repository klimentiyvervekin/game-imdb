import { dbConnect } from "../../../db/connect";
import Game from "../../../db/models/Game";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { slug } = req.query;
    const game = await Game.findOne({ slug });

    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    return res.status(200).json(game);
  } catch (error) {
    console.error("DB ERROR:", error);
    return res.status(500).json({ error: error.message, name: error.name });
  }
}
