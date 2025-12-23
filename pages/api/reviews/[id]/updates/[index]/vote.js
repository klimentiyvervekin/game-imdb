import { dbConnect } from "../../../../../../db/connect";
import Review from "../../../../../../db/models/Review";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { id, index } = req.query;
    const { type, voterId } = req.body;

    const updateIndex = Number(index);

    if (!voterId) return res.status(400).json({ error: "voterId is required" });
    if (!Number.isInteger(updateIndex)) {
      return res.status(400).json({ error: "Invalid update index" });
    }
    if (type !== "helpful" && type !== "notHelpful") {
      return res.status(400).json({ error: "Invalid vote type" });
    }

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ error: "Review not found" });

    const upd = review.updates?.[updateIndex];
    if (!upd) return res.status(404).json({ error: "Update not found" });

    upd.helpfulVoters = upd.helpfulVoters || [];
    upd.notHelpfulVoters = upd.notHelpfulVoters || [];
    upd.helpfulCount = upd.helpfulCount || 0;
    upd.notHelpfulCount = upd.notHelpfulCount || 0;

    const hasHelpful = upd.helpfulVoters.includes(voterId);
    const hasNotHelpful = upd.notHelpfulVoters.includes(voterId);

    if (type === "helpful" && hasHelpful) return res.status(200).json(review);
    if (type === "notHelpful" && hasNotHelpful) return res.status(200).json(review);

    if (type === "helpful" && hasNotHelpful) {
      upd.notHelpfulVoters = upd.notHelpfulVoters.filter((v) => v !== voterId);
      upd.notHelpfulCount = Math.max(0, upd.notHelpfulCount - 1);
    }

    if (type === "notHelpful" && hasHelpful) {
      upd.helpfulVoters = upd.helpfulVoters.filter((v) => v !== voterId);
      upd.helpfulCount = Math.max(0, upd.helpfulCount - 1);
    }

    if (type === "helpful") {
      upd.helpfulVoters.push(voterId);
      upd.helpfulCount += 1;
    } else {
      upd.notHelpfulVoters.push(voterId);
      upd.notHelpfulCount += 1;
    }

    // важно для вложенных изменений
    review.markModified("updates");
    await review.save();

    return res.status(200).json(review);
  } catch (error) {
    console.error("UPDATE VOTE ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}
