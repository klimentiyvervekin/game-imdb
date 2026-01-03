import { dbConnect } from "../../../../../db/connect";
import Post from "../../../../../db/models/Post";

export default async function handler(req, res) {
  try {
  const { id, commentId } = req.query; // <-- ВАЖНО

  await dbConnect();

  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { clientId } = req.body;
  if (!clientId) {
    return res.status(400).json({ error: "clientId is required" });
  }

  const post = await Post.findById(id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  // гарантируем массив
  const comments = Array.isArray(post.comments) ? post.comments : [];

  // найдем коммент
  const comment = comments.find((c) => String(c._id) === String(commentId));
  if (!comment) return res.status(404).json({ error: "Comment not found" });

  // проверка авторства
  if (comment.authorId !== clientId) {
    return res.status(403).json({ error: "Not allowed" });
  }

  post.comments = comments.filter((c) => String(c._id) !== String(commentId));
  await post.save();

  return res.status(200).json({ ok: true });
} catch (err) {
  console.error("DELETE COMMENT ERROR:", err);
  return res.status(500).json({ error: err.message });
}
}