// pages/api/reviews/[id]/vote.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";

import { dbConnect } from "../../../../db/connect";
import Review from "../../../../db/models/Review";

// backend logic for votes (toggle + only 1 vote per person)
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // только залогиненный пользователь
    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.dbUserId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    await dbConnect();

    const { id } = req.query;
    const { type } = req.body; // type: "helpful" | "notHelpful"

    if (type !== "helpful" && type !== "notHelpful") {
      return res.status(400).json({ error: "Invalid vote type" });
    }

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ error: "Review not found" });

    review.helpfulVoters = Array.isArray(review.helpfulVoters)
      ? review.helpfulVoters
      : [];
    review.notHelpfulVoters = Array.isArray(review.notHelpfulVoters)
      ? review.notHelpfulVoters
      : [];
    review.helpfulCount = Number(review.helpfulCount || 0);
    review.notHelpfulCount = Number(review.notHelpfulCount || 0);

    const hasHelpful = review.helpfulVoters.includes(userId);
    const hasNotHelpful = review.notHelpfulVoters.includes(userId);

    // если уже стоит такой же голос — ничего не меняем
    if (type === "helpful" && hasHelpful) return res.status(200).json(review);
    if (type === "notHelpful" && hasNotHelpful) return res.status(200).json(review);

    // если был противоположный — убираем
    if (type === "helpful" && hasNotHelpful) {
      review.notHelpfulVoters = review.notHelpfulVoters.filter((v) => v !== userId);
      review.notHelpfulCount = Math.max(0, review.notHelpfulCount - 1);
    }

    if (type === "notHelpful" && hasHelpful) {
      review.helpfulVoters = review.helpfulVoters.filter((v) => v !== userId);
      review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    }

    // добавляем новый голос
    if (type === "helpful") {
      review.helpfulVoters.push(userId);
      review.helpfulCount += 1;
    } else {
      review.notHelpfulVoters.push(userId);
      review.notHelpfulCount += 1;
    }

    await review.save();
    return res.status(200).json(review);
  } catch (error) {
    console.error("REVIEW VOTE ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}
