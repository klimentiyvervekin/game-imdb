import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../auth/[...nextauth]";

import { dbConnect } from "../../../../../../../db/connect";
import Post from "../../../../../../../db/models/Post";

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.dbUserId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { id, commentId, replyId } = req.query;

    await dbConnect();

    if (req.method !== "DELETE") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const comment = (post.comments || []).find(
      (c) => String(c._id) === String(commentId)
    );
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    const replies = Array.isArray(comment.replies) ? comment.replies : [];

    const target = replies.find((r) => String(r._id) === String(replyId));
    if (!target) return res.status(404).json({ error: "Reply not found" });

    // проверка авторства по dbUserId
    if (String(target.authorId) !== String(userId)) {
      return res.status(403).json({ error: "Not allowed" });
    }

    // каскадное удаление детей (replyToId -> String)
    const toDelete = new Set([String(replyId)]);

    let changed = true;
    while (changed) {
      changed = false;

      for (const r of replies) {
        const parentId = r.replyToId ? String(r.replyToId) : null;

        if (parentId && toDelete.has(parentId) && !toDelete.has(String(r._id))) {
          toDelete.add(String(r._id));
          changed = true;
        }
      }
    }

    comment.replies = replies.filter((r) => !toDelete.has(String(r._id)));

    await post.save();

    return res.status(200).json({ ok: true, deletedCount: toDelete.size });
  } catch (err) {
    console.error("DELETE REPLY ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
