import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

import { dbConnect } from "@/db/connect";
import Post from "@/db/models/Post";

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.dbUserId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { id, commentId } = req.query;

    await dbConnect();

    if (req.method !== "DELETE") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const comment = post.comments?.id(commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    // проверка авторства
    if (String(comment.authorId) !== String(userId)) {
      return res.status(403).json({ error: "Not allowed" });
    }

    // самое надёжное удаление сабдока
    post.comments.pull(commentId);

    await post.save();

    const populated = await Post.findById(id).populate("gameId", "title slug");
    return res.status(200).json(populated);
  } catch (err) {
    console.error("DELETE COMMENT ERROR:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
