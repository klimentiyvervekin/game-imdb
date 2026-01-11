// pages/api/likes/me.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

import { dbConnect } from "../../../db/connect";
import Post from "../../../db/models/Post";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.dbUserId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    await dbConnect();

    const me = String(userId);

    // 1) liked posts
    const posts = await Post.find({ likedBy: me })
      .populate("gameId", "title slug")
      .lean();

    // 2) liked comments + replies
    const allPosts = await Post.find({
      $or: [{ "comments.likedBy": me }, { "comments.replies.likedBy": me }],
    }).lean();

    const comments = [];
    const replies = [];

    for (const post of allPosts) {
      for (const c of post.comments || []) {
        if (Array.isArray(c.likedBy) && c.likedBy.includes(me)) {
          comments.push({ _id: c._id, text: c.text, postId: post._id });
        }

        for (const r of c.replies || []) {
          if (Array.isArray(r.likedBy) && r.likedBy.includes(me)) {
            replies.push({ _id: r._id, text: r.text, postId: post._id });
          }
        }
      }
    }

    return res.status(200).json({ posts, comments, replies });
  } catch (err) {
    console.error("LIKES ME API ERROR:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
