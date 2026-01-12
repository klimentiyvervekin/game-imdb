// pages/api/likes/me.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

import mongoose from "mongoose";
import { dbConnect } from "../../../db/connect";
import Post from "../../../db/models/Post";
import User from "../../../db/models/User";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.dbUserId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    await dbConnect();

    const meStr = String(userId);
    const meObj = mongoose.Types.ObjectId.isValid(meStr)
      ? new mongoose.Types.ObjectId(meStr)
      : null;

    const meCandidates = meObj ? [meStr, meObj] : [meStr];

    // 1) liked posts
    const posts = await Post.find({ likedBy: { $in: meCandidates } })
      .populate("gameId", "title slug")
      .lean();

    // 2 liked comments + replies
    const allPosts = await Post.find({
      $or: [
        { "comments.likedBy": { $in: meCandidates } },
        { "comments.replies.likedBy": { $in: meCandidates } },
      ],
    })
      .populate("gameId", "title slug")
      .lean();

    const comments = [];
    const replies = [];
    const authorIds = new Set();

    for (const post of allPosts) {
      for (const c of post.comments || []) {
        const cLiked =
          Array.isArray(c.likedBy) &&
          c.likedBy.some((x) => String(x) === meStr);

        if (cLiked) {
          const aId = String(c.authorId || "");
          if (aId) authorIds.add(aId);

          comments.push({
            _id: String(c._id),
            postId: String(post._id),
            authorId: aId,
            text: c.text,
            imageUrl: c.imageUrl || "",
            game: post.gameId
              ? {
                  _id: String(post.gameId._id),
                  title: post.gameId.title,
                  slug: post.gameId.slug,
                }
              : null,
          });
        }

        for (const r of c.replies || []) {
          const rLiked =
            Array.isArray(r.likedBy) &&
            r.likedBy.some((x) => String(x) === meStr);

          if (rLiked) {
            const aId = String(r.authorId || "");
            if (aId) authorIds.add(aId);

            replies.push({
              _id: String(r._id),
              postId: String(post._id),
              commentId: String(c._id),
              authorId: aId,
              text: r.text,
              imageUrl: r.imageUrl || "",
              game: post.gameId
                ? {
                    _id: String(post.gameId._id),
                    title: post.gameId.title,
                    slug: post.gameId.slug,
                  }
                : null,
            });
          }
        }
      }
    }

    // берём только те authorId которые реально ObjectId
    const idsAll = Array.from(authorIds).filter(Boolean);
    const idsForMongo = idsAll.filter((x) =>
      mongoose.Types.ObjectId.isValid(String(x))
    );

    const users = idsForMongo.length
      ? await User.find({ _id: { $in: idsForMongo } })
          .select("name avatarUrl")
          .lean()
      : [];

    const byId = new Map(users.map((u) => [String(u._id), u]));

    const commentsWithAuthors = comments.map((c) => {
      const u = byId.get(String(c.authorId));
      return {
        ...c,
        author: u
          ? {
              _id: String(u._id),
              name: u.name || "User",
              avatarUrl: u.avatarUrl || "",
            }
          : { _id: c.authorId, name: "User", avatarUrl: "" },
      };
    });

    const repliesWithAuthors = replies.map((r) => {
      const u = byId.get(String(r.authorId));
      return {
        ...r,
        author: u
          ? {
              _id: String(u._id),
              name: u.name || "User",
              avatarUrl: u.avatarUrl || "",
            }
          : { _id: r.authorId, name: "User", avatarUrl: "" },
      };
    });

    return res.status(200).json({
      posts,
      comments: commentsWithAuthors,
      replies: repliesWithAuthors,
    });
  } catch (err) {
    console.error("LIKES ME API ERROR:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
