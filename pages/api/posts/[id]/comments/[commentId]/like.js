import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../auth/[...nextauth]";

import { dbConnect } from "../../../../../../db/connect";
import Post from "../../../../../../db/models/Post";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.dbUserId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { id, commentId } = req.query;
  await dbConnect();

  const post = await Post.findById(id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  const comment = post.comments.id(commentId);
  if (!comment) return res.status(404).json({ error: "Comment not found" });

  const likedBy = Array.isArray(comment.likedBy) ? comment.likedBy : [];
  const already = likedBy.includes(userId);

  comment.likedBy = already ? likedBy.filter((x) => x !== userId) : [...likedBy, userId];
  await post.save();

  const populated = await Post.findById(id).populate("gameId", "title slug");
  return res.status(200).json(populated);
}
