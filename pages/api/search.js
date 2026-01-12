// pages/api/search.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

import { dbConnect } from "../../db/connect";
import User from "../../db/models/User";

export default async function handler(req, res) {
  try {
    // only with login
    const session = await getServerSession(req, res, authOptions);
    const myId = session?.user?.dbUserId;
    if (!myId) return res.status(401).json({ error: "Unauthorized" });

    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const q = String(req.query.q || "").trim();
    if (!q) return res.status(200).json({ games: [], users: [] });

    // ------===== USERS MongoDB =====-----
    await dbConnect();
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"); // to find everything correctly

    const users = await User.find({
      $or: [{ name: rx }, { email: rx }],
    })
      .select("name avatarUrl")
      .limit(8)
      .lean();
    // 8 users maximal. "lean" for normal js objects

    // ===== GAMES RAWG ========= //
    const apiKey = process.env.RAWG_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "RAWG_API_KEY is not set" });
    }

    const url = `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(
      q
    )}&page_size=8`;

    const resp = await fetch(url);
    if (!resp.ok) {
      return res.status(502).json({ error: "RAWG request failed" });
    }

    const data = await resp.json();
    const games = (data?.results || []).map((g) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
    }));

    return res.status(200).json({
      users: users.map((u) => ({
        _id: String(u._id),
        name: u.name || "User",
        avatarUrl: u.avatarUrl || "",
      })),
      games,
    });
  } catch (err) {
    console.error("SEARCH API ERROR:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
