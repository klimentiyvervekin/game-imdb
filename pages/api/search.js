// pages/api/search.js ...........
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

import { dbConnect } from "../../db/connect";
import User from "../../db/models/User";
import Game from "../../db/models/Game";

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    const myId = session?.user?.dbUserId;
    if (!myId) return res.status(401).json({ error: "Unauthorized" });

    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const q = String(req.query.q || "").trim();
    if (!q) return res.status(200).json({ games: [], users: [] });

    await dbConnect();

    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(safe, "i");

    // USERS (MongoDB)
    const users = await User.find({ name: rx })
      .select("name avatarUrl")
      .limit(8)
      .lean();

    // GAMES (MongoDB) только те, что реально есть у меня
    const games = await Game.find({ title: rx })
      .select("title slug")
      .limit(8)
      .lean();

    return res.status(200).json({
      users: users.map((u) => ({
        _id: String(u._id),
        name: u.name || "User",
        avatarUrl: u.avatarUrl || "",
      })),
      games: games.map((g) => ({
        _id: String(g._id),
        name: g.title, 
        slug: g.slug,
      })),
    });
  } catch (err) {
    console.error("SEARCH API ERROR:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
