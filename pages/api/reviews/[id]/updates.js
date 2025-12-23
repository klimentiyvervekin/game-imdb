import { dbConnect } from "../../../../db/connect";
import Review from "../../../../db/models/Review";

// backend create update review

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { id } = req.query;
    const { text } = req.body;

    const trimmed = (text || "").trim();
    if (!trimmed) {
      return res.status(400).json({ error: "Update text cannot be empty" });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    review.updates.push({ text: trimmed });
    await review.save();

    return res.status(201).json(review);
  } catch (error) {
    console.error("REVIEW UPDATE ERROR:", error);
    return res.status(500).json({ error: error.message, name: error.name });
  }
}