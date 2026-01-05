import { dbConnect } from "../../../../../../../db/connect";
import Post from "../../../../../../../db/models/Post";

export default async function handler(req, res) {
  try {
    const { id, commentId, replyId } = req.query;

    await dbConnect();

    if (req.method !== "DELETE") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { clientId } = req.body;
    if (!clientId) return res.status(400).json({ error: "clientId is required" });

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const comment = (post.comments || []).find((c) => String(c._id) === String(commentId));
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    const replies = Array.isArray(comment.replies) ? comment.replies : [];

    const reply = replies.find((r) => String(r._id) === String(replyId));
    if (!reply) return res.status(404).json({ error: "Reply not found" });

    if (reply.authorId !== clientId) {
      return res.status(403).json({ error: "Not allowed" });
    }

    // delete reply
    comment.replies = replies.filter((r) => String(r._id) !== String(replyId));

    await post.save();

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("DELETE REPLY ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
