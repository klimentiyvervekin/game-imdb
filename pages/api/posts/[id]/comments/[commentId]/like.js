import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../auth/[...nextauth]";
import mongoose from "mongoose";

import { dbConnect } from "../../../../../../db/connect";
import Post from "../../../../../../db/models/Post";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  const myId = session?.user?.dbUserId;
  if (!myId) return res.status(401).json({ error: "Unauthorized" });

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id, commentId } = req.query;
  await dbConnect();

  const post = await Post.findById(id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  const comment = post.comments.id(commentId);
  if (!comment) return res.status(404).json({ error: "Comment not found" });

  const me = new mongoose.Types.ObjectId(myId);

  const likedBy = Array.isArray(comment.likedBy) ? comment.likedBy : [];
  const already = likedBy.some((x) => String(x) === String(me));

  comment.likedBy = already
    ? likedBy.filter((x) => String(x) !== String(me))
    : [...likedBy, me];

  await post.save();

  const populated = await Post.findById(id).populate("gameId", "title slug");
  return res.status(200).json(populated);
}

