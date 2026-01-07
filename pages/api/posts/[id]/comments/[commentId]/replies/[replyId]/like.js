import { dbConnect } from "@/db/connect";
import Post from "@/db/models/Post";

export default async function handler(req, res) {
  const { id, commentId, replyId } = req.query;

  await dbConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { clientId } = req.body;
  if (!clientId) return res.status(400).json({ error: "clientId is required" });

  const post = await Post.findById(id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  const comment = post.comments.id(commentId);
  if (!comment) return res.status(404).json({ error: "Comment not found" });

  const reply = comment.replies.id(replyId);
  if (!reply) return res.status(404).json({ error: "Reply not found" });

  if (!Array.isArray(reply.likedBy)) reply.likedBy = [];

  const alreadyLiked = reply.likedBy.includes(clientId);
  reply.likedBy = alreadyLiked
    ? reply.likedBy.filter((x) => x !== clientId)
    : [...reply.likedBy, clientId];

  await post.save();

  const populated = await Post.findById(id).populate("gameId", "title slug");
  return res.status(200).json(populated);
}
