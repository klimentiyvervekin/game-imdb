import { dbConnect } from "../../../../../../db/connect";
import Post from "../../../../../../db/models/Post";

export default async function handler(req, res) {
  const { id, commentId } = req.query;
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

  comment.likedBy = Array.isArray(comment.likedBy) ? comment.likedBy : [];

  const hasLike = comment.likedBy.includes(clientId);
  if (hasLike) {
    comment.likedBy = comment.likedBy.filter((x) => x !== clientId);
  } else {
    comment.likedBy.push(clientId);
  }

  await post.save();

  // вернем обновленный пост чтобы UI сразу обновился
  const populated = await Post.findById(id).populate("gameId", "title slug");
  return res.status(200).json(populated);
}
