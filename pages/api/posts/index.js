import { dbConnect } from "../../../db/connect";
import Post from "../../../db/models/Post";

export default async function handler(req, res) {
  await dbConnect();

  // GET /api/posts  (latest posts)
  // GET /api/posts?gameId=<id>  (posts for one game)
  if (req.method === "GET") {
    const { gameId } = req.query;

    const filter = gameId ? { gameId } : {};
    const posts = await Post.find(filter).sort({ createdAt: -1 }).limit(50);

    return res.status(200).json(posts);
  }

  // POST /api/posts
  if (req.method === "POST") {
    const {
      gameId,
      content,
      imageUrl = "",
      videoUrl = "",
      text,
      authorId = null,
    } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Post text cannot be empty" });
    }
    if (!gameId) {
      return res.status(400).json({ error: "gameId is required" });
    }

    const trimmed = (content || "").trim();
    if (!trimmed)
      return res.status(400).json({ error: "post text cannot be empty" });

    if (!authorId) {
      return res.status(400).json({ error: "authorId is required" });
    }

    const post = await Post.create({
      gameId,
      content: trimmed,
      text: text.trim(),
      imageUrl,
      videoUrl,
      authorId,
    });

    const populated = await Post.findById(created._id).populate(
      "gameId",
      "title slug"
    );
    return res.status(201).json(post);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
