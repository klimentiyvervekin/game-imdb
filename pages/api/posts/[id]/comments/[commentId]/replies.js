import { dbConnect } from "../../../../../../db/connect";
import Post from "../../../../../../db/models/Post";

export default async function handler(req, res) {
  try {
    const { id, commentId } = req.query;

    await dbConnect();

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { clientId, text } = req.body;
    const trimmed = (text || "").trim();

    if (!clientId) return res.status(400).json({ error: "clientId is required" });
    if (!trimmed) return res.status(400).json({ error: "Reply cannot be empty" });

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const comment = (post.comments || []).find((c) => String(c._id) === String(commentId));
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    // гарантируем replies массив
    if (!Array.isArray(comment.replies)) comment.replies = [];

    comment.replies.push({
      authorId: clientId,
      text: trimmed,
    });

    await post.save();
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("REPLY ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
