import { dbConnect } from "../../../../db/connect";
import Review from "../../../../db/models/Review";

// this file is backend logic for votes (add vote, toggle vote, only 1 vote per person and so on)

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

    const hasHelpful = review.helpfulVoters.includes(voterId); // list of people who said 👍🏻
    const hasNotHelpful = review.notHelpfulVoters.includes(voterId); // list of people who said 👎🏻

    // if person voted - it changes nothing
    if (type === "helpful" && hasHelpful) {
      return res.status(200).json(review);
    }
    if (type === "notHelpful" && hasNotHelpful) {
      return res.status(200).json(review);
    }

    // if person voted opposite - toggle
    if (type === "helpful" && hasNotHelpful) {
      review.notHelpfulVoters = review.notHelpfulVoters.filter((v) => v !== voterId);
      review.notHelpfulCount = Math.max(0, review.notHelpfulCount - 1); // "Math.max" is protection against negative numbers
    }

    if (type === "notHelpful" && hasHelpful) {
      review.helpfulVoters = review.helpfulVoters.filter((v) => v !== voterId);
      review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    }

    // add new vote
    if (type === "helpful") {
      review.helpfulVoters.push(voterId); // "push" add new value to the end of array
      review.helpfulCount += 1;
    } else {
      review.notHelpfulVoters.push(voterId);
      review.notHelpfulCount += 1;
    }

    await review.save();
    return res.status(200).json(review); // send actuall review to user
  } catch (error) {
    console.error("REVIEW VOTE ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}
