import { dbConnect } from "../../../../db/connect";
import Post from "../../../../db/models/Post";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { id } = req.query;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Bad user id" });
    }

    await dbConnect();

    const posts = await Post.find({ authorId: id })
      .populate("gameId", "title slug")
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json(posts);
  } catch (err) {
    console.error("USER POSTS API ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
