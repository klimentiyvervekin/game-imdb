import { dbConnect } from "../../../../db/connect";
import Review from "../../../../db/models/Review";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { id } = req.query;
    const { type, voterId } = req.body; // type: "helpful" | "notHelpful"

    if (!voterId) return res.status(400).json({ error: "voterId is required" });
    if (type !== "helpful" && type !== "notHelpful") {
      return res.status(400).json({ error: "Invalid vote type" });
    }

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ error: "Review not found" });

    review.helpfulVoters = review.helpfulVoters || [];
    review.notHelpfulVoters = review.notHelpfulVoters || [];
    review.helpfulCount = review.helpfulCount || 0;
    review.notHelpfulCount = review.notHelpfulCount || 0;

    const hasHelpful = review.helpfulVoters.includes(voterId);
    const hasNotHelpful = review.notHelpfulVoters.includes(voterId);

    // если уже голосовал так же — ничего не делаем
    if (type === "helpful" && hasHelpful) {
      return res.status(200).json(review);
    }
    if (type === "notHelpful" && hasNotHelpful) {
      return res.status(200).json(review);
    }

    // если голосовал противоположно — переключаем
    if (type === "helpful" && hasNotHelpful) {
      review.notHelpfulVoters = review.notHelpfulVoters.filter((v) => v !== voterId);
      review.notHelpfulCount = Math.max(0, review.notHelpfulCount - 1);
    }

    if (type === "notHelpful" && hasHelpful) {
      review.helpfulVoters = review.helpfulVoters.filter((v) => v !== voterId);
      review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    }

    // добавляем новый голос
    if (type === "helpful") {
      review.helpfulVoters.push(voterId);
      review.helpfulCount += 1;
    } else {
      review.notHelpfulVoters.push(voterId);
      review.notHelpfulCount += 1;
    }

    await review.save();
    return res.status(200).json(review);
  } catch (error) {
    console.error("REVIEW VOTE ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}
