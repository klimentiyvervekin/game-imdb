import { dbConnect } from "../../../db/connect";
import User from "../../../db/models/User";

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query; // clientId

  // GET /api/users/:id
  if (req.method === "GET") {
    let user = await User.findById(id);

    // если юзера нет — сделаем заглушку (чтобы профиль открывался всегда)
    if (!user) {
      user = await User.create({
        _id: id,
        username: "Anonymous",
        bio: "",
        avatarUrl: "",
      });
    }

    return res.status(200).json(user);
  }

  // PUT /api/users/:id
  if (req.method === "PUT") {
    const { username, bio = "", avatarUrl = "" } = req.body;

    const trimmedName = (username || "").trim();
    if (!trimmedName) {
      return res.status(400).json({ error: "username is required" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { username: trimmedName, bio: (bio || "").trim(), avatarUrl: avatarUrl || "" },
      { new: true, upsert: true } // upsert = создать если нет
    );

    return res.status(200).json(user);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
