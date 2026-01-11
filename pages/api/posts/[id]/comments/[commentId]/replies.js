// pages/api/posts/[id]/comments/[commentId]/replies.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../auth/[...nextauth]";

import { dbConnect } from "../../../../../../db/connect";
import Post from "../../../../../../db/models/Post";

export default async function handler(req, res) {
  try {
    // теперь reply может писать только залогиненный пользователь
    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.dbUserId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { id, commentId } = req.query;

    await dbConnect();

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { text, imageUrl = "", replyToId = null } = req.body;
    const trimmed = (text || "").trim();

    if (!trimmed) {
      return res.status(400).json({ error: "Reply cannot be empty" });
    }

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    if (!Array.isArray(comment.replies)) comment.replies = [];

    comment.replies.push({
      authorId: userId, // dbUserId из session
      text: trimmed,
      imageUrl,
      replyToId,
    });

    await post.save();

    const populated = await Post.findById(id).populate("gameId", "title slug");
    return res.status(200).json(populated);
  } catch (err) {
    console.error("REPLY ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
