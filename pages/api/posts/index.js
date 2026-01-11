// pages/api/posts/index.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

import { dbConnect } from "../../../db/connect";
import Post from "../../../db/models/Post";

export default async function handler(req, res) {
  try {
    await dbConnect();

    // GET /api/posts (публично)
    // GET /api/posts?gameId=<id> (публично)
    if (req.method === "GET") {
      const { gameId } = req.query;

      const filter = gameId ? { gameId } : {};
      const posts = await Post.find(filter)
        .populate("gameId", "title slug")
        .sort({ createdAt: -1 })
        .limit(50);

      return res.status(200).json(posts);
    }

    // POST /api/posts (только залогиненный)
    if (req.method === "POST") {
      const session = await getServerSession(req, res, authOptions);
      const userId = session?.user?.dbUserId;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const { gameId, content, imageUrl = "", videoUrl = "" } = req.body;

      if (!gameId) {
        return res.status(400).json({ error: "gameId is required" });
      }

      const trimmed = (content || "").trim();
      if (!trimmed) {
        return res.status(400).json({ error: "post text cannot be empty" });
      }

      const post = await Post.create({
        gameId,
        content: trimmed,
        imageUrl,
        videoUrl,
        authorId: userId, // берём только из сессии
      });

      const populated = await Post.findById(post._id).populate(
        "gameId",
        "title slug"
      );

      return res.status(201).json(populated);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("POSTS INDEX ERROR:", error);
    return res.status(500).json({ error: error.message, name: error.name });
  }
}
