import { dbConnect } from "../../../db/connect";
import Post from "../../../db/models/Post";

export default async function handler(req, res) {
  try {
    await dbConnect();

    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const posts = await Post.find() // find all posts in the collection
      .populate("gameId", "title slug coverUrl") // populate says "took gameId go to collection games find item with this id and substitute it for gameId"
      .sort({ createdAt: -1 });

    return res.status(200).json(posts);
  } catch (error) {
    console.error("DB ERROR:", error);
    return res.status(500).json({
      error: error.message,
      name: error.name,
    });
  }
}
