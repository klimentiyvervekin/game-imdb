// pages/api/reviews/[id]/updates/[index]/vote.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../auth/[...nextauth]";

import { dbConnect } from "../../../../../../db/connect";
import Review from "../../../../../../db/models/Review";

// votes for update reviews (only logged-in users)
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

    const { id, index } = req.query;
    const { type } = req.body;

    const updateIndex = Number(index);

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

    upd.helpfulVoters = Array.isArray(upd.helpfulVoters) ? upd.helpfulVoters : [];
    upd.notHelpfulVoters = Array.isArray(upd.notHelpfulVoters) ? upd.notHelpfulVoters : [];
    upd.helpfulCount = Number(upd.helpfulCount || 0);
    upd.notHelpfulCount = Number(upd.notHelpfulCount || 0);

    const hasHelpful = upd.helpfulVoters.includes(userId);
    const hasNotHelpful = upd.notHelpfulVoters.includes(userId);

    // если уже стоит такой же голос — ничего не меняем
    if (type === "helpful" && hasHelpful) return res.status(200).json(review);
    if (type === "notHelpful" && hasNotHelpful) return res.status(200).json(review);

    // если был противоположный — убираем
    if (type === "helpful" && hasNotHelpful) {
      upd.notHelpfulVoters = upd.notHelpfulVoters.filter((v) => v !== userId);
      upd.notHelpfulCount = Math.max(0, upd.notHelpfulCount - 1);
    }

    if (type === "notHelpful" && hasHelpful) {
      upd.helpfulVoters = upd.helpfulVoters.filter((v) => v !== userId);
      upd.helpfulCount = Math.max(0, upd.helpfulCount - 1);
    }

    // добавляем новый голос
    if (type === "helpful") {
      upd.helpfulVoters.push(userId);
      upd.helpfulCount += 1;
    } else {
      upd.notHelpfulVoters.push(userId);
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
