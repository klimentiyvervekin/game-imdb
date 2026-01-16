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

      return res.status(200).json({
        _id: String(user._id),
        name: user.name || "User",
        avatarUrl: user.avatarUrl || "",
        bio: user.bio || "",
        email: user.email || "",
        followingUsers: user.followingUsers || [],
        followingGames: user.followingGames || [],
      });
    }

    // POST /api/users/me
    // toggle follow: body { kind: "user"|"game", id: "..." }
    if (req.method === "POST") {
      const { kind, id } = req.body || {};
      if (!id || (kind !== "user" && kind !== "game")) {
        return res.status(400).json({ error: "Bad request" });
      }

      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const field = kind === "user" ? "followingUsers" : "followingGames";
      const sid = String(id);

      const list = Array.isArray(user[field]) ? user[field].map(String) : [];
      user[field] = list.includes(sid)
        ? list.filter((x) => x !== sid)
        : [...list, sid];

      await user.save();

      return res.status(200).json({
        followingUsers: user.followingUsers || [],
        followingGames: user.followingGames || [],
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("USERS ME ERROR:", error);
    return res.status(500).json({ error: error.message, name: error.name });
  }
}
