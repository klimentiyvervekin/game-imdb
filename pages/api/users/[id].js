import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

import { dbConnect } from "../../../db/connect";
import User from "../../../db/models/User";

export default async function handler(req, res) {
  try {
    const { id } = req.query; // dbUserId (Mongo _id)

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Bad user id" });
    }

    await dbConnect();

    // GET /api/users/:id  (публичный профиль)
    if (req.method === "GET") {
      const user = await User.findById(id).lean();
      if (!user) return res.status(404).json({ error: "User not found" });

      return res.status(200).json({
        _id: String(user._id),
        name: user.name || "User",
        avatarUrl: user.avatarUrl || "",
        bio: user.bio || "",
      });
    }

    // PUT /api/users/:id (только владелец)
    if (req.method === "PUT") {
      const session = await getServerSession(req, res, authOptions);
      const myId = session?.user?.dbUserId;
      if (!myId) return res.status(401).json({ error: "Unauthorized" });

      if (String(myId) !== String(id)) {
        return res.status(403).json({ error: "Not allowed" });
      }

      // не ставлю avatarUrl = "" по умолчанию, чтобы не затирать
      const { name, bio = "", avatarUrl } = req.body;

      const trimmedName = String(name || "").trim();
      if (!trimmedName) {
        return res.status(400).json({ error: "name is required" });
      }

      // обновляем avatarUrl только если он реально пришёл
      const update = {
        name: trimmedName,
        bio: String(bio || "").trim(),
      };

      if (typeof avatarUrl === "string") {
        update.avatarUrl = avatarUrl.trim();
      }

      const user = await User.findByIdAndUpdate(id, update, { new: true }).lean();

      if (!user) return res.status(404).json({ error: "User not found" });

      return res.status(200).json({
        _id: String(user._id),
        name: user.name || "User",
        avatarUrl: user.avatarUrl || "",
        bio: user.bio || "",
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("USERS [id] ERROR:", error);
    return res.status(500).json({ error: error.message, name: error.name });
  }
}
