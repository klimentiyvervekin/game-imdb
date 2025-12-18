import { dbConnect } from "../../../db/connect";
import Game from "../../../db/models/Game";

export default async function handler(req, res) {
  try {
    await dbConnect();

    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const games = await Game.find().sort({ createdAt: -1 }); // sort means "first we took new games than old "
    return res.status(200).json(games);
  } catch (error) {
    console.error("DB ERROR:", error);
    return res.status(500).json({
      error: error.message,
      name: error.name,
    });
  }
}

// this code connects to the database and gets all games
// if something goes wrong it returns an error
