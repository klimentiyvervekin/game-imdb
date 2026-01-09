// pages/api/users/me.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

import { dbConnect } from "../../../db/connect";
import User from "../../../db/models/User";

export default async function handler(req, res) {
  try {
    await dbConnect();

    // только залогиненный
    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.dbUserId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // GET /api/users/me
    if (req.method === "GET") {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      return res.status(200).json(user);
    }

    // POST /api/users/me
    // просто "убедиться что я есть" (на всякий случай)
    if (req.method === "POST") {
      const email = session?.user?.email || "";
      const name = session?.user?.name || "User";

      const user = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            // не перетираем пустыми значениями
            ...(email ? { email } : {}),
            ...(name ? { name } : {}),
          },
        },
        { new: true, upsert: true }
      );

      return res.status(200).json(user);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("USERS ME ERROR:", error);
    return res.status(500).json({ error: error.message, name: error.name });
  }
}
