import { dbConnect } from "../../../../../db/connect";
import Review from "../../../../../db/models/Review";

// backend delete updated review

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { id, index } = req.query;
    const updateIndex = Number(index);

    if (!Number.isInteger(updateIndex)) {
      return res.status(400).json({ error: "Invalid update index" });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    if (
      !Array.isArray(review.updates) ||
      updateIndex < 0 ||
      updateIndex >= review.updates.length
    ) {
      return res.status(404).json({ error: "Update not found" });
    }

    review.updates.splice(updateIndex, 1);
    await review.save();

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("DELETE UPDATE ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}
