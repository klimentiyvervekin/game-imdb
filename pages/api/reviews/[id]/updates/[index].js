import { dbConnect } from "../../../../../db/connect";
import Review from "../../../../../db/models/Review";

// backend delete updated review

const EDIT_WINDOW_MS = 15 * 60 * 1000;

export default async function handler(req, res) {
  const { id, index } = req.query;
  const updateIndex = Number(index);

  // "isInteger" means "is this number an integer?" (integer = whole number)
  if (!Number.isInteger(updateIndex)) {
    return res.status(400).json({ error: "Invalid update index" });
  }

  try {
    await dbConnect();

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    const upd = review.updates?.[updateIndex];
    if (!upd) return res.status(404).json({ error: "Update not found" });

    if (req.method === "DELETE") {
      review.updates.splice(updateIndex, 1);
      review.markModified("updates");
      await review.save();
      return res.status(200).json({ ok: true });
    }

    // PATCH: edit update within 15 minutes
    if (req.method === "PATCH") {
      const { text, authorId, hasSpoilers } = req.body;

      if (!authorId || upd.authorId !== authorId) {
        return res.status(403).json({ error: "Not allowed" });
      }

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

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("DELETE UPDATE ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}
