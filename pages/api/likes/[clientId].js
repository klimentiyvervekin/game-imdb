import { dbConnect } from "../../../db/connect";
import Post from "../../../db/models/Post";

export default async function handler(req, res) {
  const { clientId } = req.query;

  await dbConnect();

  // 1️⃣ Посты
  const posts = await Post.find({ likedBy: clientId })
    .populate("gameId", "title slug")
    .lean();

  // 2️⃣ Комментарии и replies
  const allPosts = await Post.find({
    $or: [
      { "comments.likedBy": clientId },
      { "comments.replies.likedBy": clientId },
    ],
  }).lean();

  const comments = [];
  const replies = [];

  for (const post of allPosts) {
    for (const c of post.comments || []) {
      if (Array.isArray(c.likedBy) && c.likedBy.includes(clientId)) {
        comments.push({
          _id: c._id,
          text: c.text,
          postId: post._id,
        });
      }

      for (const r of c.replies || []) {
        if (Array.isArray(r.likedBy) && r.likedBy.includes(clientId)) {
          replies.push({
            _id: r._id,
            text: r.text,
            postId: post._id,
          });
        }
      }
    }
  }

  res.status(200).json({
    posts,
    comments,
    replies,
  });
}
