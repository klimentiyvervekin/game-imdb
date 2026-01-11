// pages/api/reviews/[id]/updates/[index].js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]";

import { dbConnect } from "../../../../../db/connect";
import Review from "../../../../../db/models/Review";

const EDIT_WINDOW_MS = 15 * 60 * 1000;

export default async function handler(req, res) {
  const { id, index } = req.query;
  const updateIndex = Number(index);

  if (!Number.isInteger(updateIndex)) {
    return res.status(400).json({ error: "Invalid update index" });
  }

  try {
    // DELETE/PATCH - только залогиненный
    if (req.method !== "DELETE" && req.method !== "PATCH") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.dbUserId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    await dbConnect();

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ error: "Review not found" });

    const upd = review.updates?.[updateIndex];
    if (!upd) return res.status(404).json({ error: "Update not found" });

    const isMine = String(upd.authorId) === String(userId);
    if (!isMine) return res.status(403).json({ error: "Not allowed" });

    if (req.method === "DELETE") {
      review.updates.splice(updateIndex, 1);
      review.markModified("updates");
      await review.save();
      return res.status(200).json({ ok: true });
    }

    // PATCH: edit update within 15 minutes
    if (req.method === "PATCH") {
      const { text, hasSpoilers } = req.body;

      const age = Date.now() - new Date(upd.createdAt).getTime();
      if (age > EDIT_WINDOW_MS) {
        return res.status(403).json({ error: "Edit window expired" });
      }

      const trimmed = (text || "").trim();
      if (!trimmed) {
        return res.status(400).json({ error: "Update text cannot be empty" });
      }

      upd.text = trimmed;
      upd.hasSpoilers = Boolean(hasSpoilers);

      review.markModified("updates");
      await review.save();

      return res.status(200).json(review);
    }
  } catch (error) {
    console.error("UPDATE [index] ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}
