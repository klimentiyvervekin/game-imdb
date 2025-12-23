import { dbConnect } from "../../../db/connect";
import Review from "../../../db/models/Review";

// this file directed to only 1 id, delete only 1 review
export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const deleted = await Review.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Review not found" });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("DELETE REVIEW ERROR:", error);
    return res.status(500).json({ error: error.message, name: error.name });
  }
}
