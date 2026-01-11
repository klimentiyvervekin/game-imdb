// pages/api/users/me.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

import { dbConnect } from "../../../db/connect";
import User from "../../../db/models/User";

export default async function handler(req, res) {
  try {
    await dbConnect();

    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.dbUserId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // GET /api/users/me
    if (req.method === "GET") {
      const user = await User.findById(userId).lean();
      if (!user) return res.status(404).json({ error: "User not found" });

      // отдаём только безопасные поля (как публичный профиль)
      return res.status(200).json({
        _id: String(user._id),
        name: user.name || "User",
        avatarUrl: user.avatarUrl || "",
        bio: user.bio || "",
        email: user.email || "",
      });
    }

    // POST /api/users/me
    // "убедиться что я есть" — но БЕЗ upsert без email (иначе 500)
    if (req.method === "POST") {
      const email = String(session?.user?.email || "").trim();
      const name = String(session?.user?.name || "User").trim();

      // если вдруг session без email — не создаём (иначе UserSchema required email даст 500)
      if (!email) {
        return res.status(400).json({ error: "Session email is missing" });
      }

      // создаём/обновляем безопасно:
      // - upsert разрешаем, но email кладём в $setOnInsert (обязательно для создания)
      const user = await User.findOneAndUpdate(
        { _id: userId },
        {
          $set: {
            ...(name ? { name } : {}),
          },
          $setOnInsert: {
            email, // обязателен при создании
            name: name || "User",
            avatarUrl: "",
            bio: "",
            provider: "google",
          },
        },
        { new: true, upsert: true }
      ).lean();

      return res.status(200).json({
        _id: String(user._id),
        name: user.name || "User",
        avatarUrl: user.avatarUrl || "",
        bio: user.bio || "",
        email: user.email || "",
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("USERS ME ERROR:", error);
    return res.status(500).json({ error: error.message, name: error.name });
  }
}
