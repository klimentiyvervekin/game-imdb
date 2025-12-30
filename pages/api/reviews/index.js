import { dbConnect } from "../../../db/connect";
import Review from "../../../db/models/Review";

export default async function handler(req, res) {
  try {
    await dbConnect();

    // GET /api/reviews?gameId=<id>
    if (req.method === "GET") {
      const { gameId } = req.query;

      if (!gameId) {
        return res.status(400).json({ error: "gameId is required" });
      }

      const reviews = await Review.find({ gameId }).sort({ createdAt: -1 });
      return res.status(200).json(reviews);
    }

    // POST /api/reviews
    if (req.method === "POST") {
      const { gameId, rating, text, authorId, hasSpoilers } = req.body;

      // basic validation
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

      if (!gameId) {
        return res.status(400).json({ error: "gameId is required" });
      }

      if (!authorId) {
        return res.status(400).json({ error: "authorId is required" });
      }

      const created = await Review.create({
        gameId,
        rating: numericRating,
        text: trimmedText,
        user: "Anonymous", // MVP placeholder
        authorId,
        hasSpoilers: Boolean(hasSpoilers),
      });

      return res.status(201).json(created);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("REVIEWS ERROR:", error);
    return res.status(500).json({ error: error.message, name: error.name });
  }
}
