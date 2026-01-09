// pages/api/reviews/[id].js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

import { dbConnect } from "../../../db/connect";
import Review from "../../../db/models/Review";

const EDIT_WINDOW_MS = 15 * 60 * 1000;

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    await dbConnect();

    // PATCH и DELETE — только для залогиненных
    if (req.method === "PATCH" || req.method === "DELETE") {
      const session = await getServerSession(req, res, authOptions);
      const userId = session?.user?.dbUserId;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const review = await Review.findById(id);
      if (!review) return res.status(404).json({ error: "Review not found" });

      const isMine = String(review.authorId) === String(userId);
      if (!isMine) return res.status(403).json({ error: "Not allowed" });

      // DELETE /api/reviews/:id
      if (req.method === "DELETE") {
        await Review.findByIdAndDelete(id);
        return res.status(200).json({ ok: true });
      }

      // PATCH /api/reviews/:id  (edit within 15 minutes)
      if (req.method === "PATCH") {
        const { text, rating, hasSpoilers } = req.body;

        const age = Date.now() - new Date(review.createdAt).getTime();
        if (age > EDIT_WINDOW_MS) {
          return res.status(403).json({ error: "Edit window expired" });
        }

        const trimmedText = (text || "").trim();
        if (!trimmedText) {
          return res.status(400).json({ error: "Review text cannot be empty" });
        }

        const numericRating = Number(rating);
        if (
          !Number.isFinite(numericRating) ||
          numericRating < 1 ||
          numericRating > 10
        ) {
          return res
            .status(400)
            .json({ error: "Rating must be between 1 and 10" });
        }

        review.text = trimmedText;
        review.rating = numericRating;
        review.hasSpoilers = Boolean(hasSpoilers);

        await review.save();
        return res.status(200).json(review);
      }
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("REVIEW [id] ERROR:", error);
    return res.status(500).json({ error: error.message, name: error.name });
  }
}
