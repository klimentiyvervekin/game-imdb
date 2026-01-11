// pages/api/posts/[id].js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

import { dbConnect } from "../../../db/connect";
import Post from "../../../db/models/Post";

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    // только залогиненный пользователь
    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.dbUserId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    await dbConnect();

    // найдём пост один раз, чтобы проверить автора
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    // удалять/редактировать может только автор
    const isMine = String(post.authorId) === String(userId);
    if ((req.method === "DELETE" || req.method === "PATCH") && !isMine) {
      return res.status(403).json({ error: "Not allowed" });
    }

    if (req.method === "DELETE") {
      await Post.findByIdAndDelete(id);
      return res.status(200).json({ ok: true });
    }

    if (req.method === "PATCH") {
      const { content, imageUrl, videoUrl } = req.body;

      const trimmed = (content || "").trim();
      if (!trimmed) {
        return res.status(400).json({ error: "Post content cannot be empty" });
      }

      // обновляем только то, что пришло
      post.content = trimmed;

      if (imageUrl !== undefined) post.imageUrl = imageUrl;
      if (videoUrl !== undefined) post.videoUrl = videoUrl;

      await post.save();

      const populated = await Post.findById(id).populate(
        "gameId",
        "title slug"
      );
      return res.status(200).json(populated);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("POSTS [id] ERROR:", error);
    return res.status(500).json({ error: error.message, name: error.name });
  }
}
