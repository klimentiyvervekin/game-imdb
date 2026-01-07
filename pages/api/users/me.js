import { dbConnect } from "../../../db/connect";
import User from "../../../db/models/User";

export default async function handler(req, res) {
  await dbConnect();

  // GET /api/users/me?clientId=...
  if (req.method === "GET") {
    const { clientId } = req.query;
    if (!clientId)
      return res.status(400).json({ error: "clientId is required" });

    const user = await User.findOne({ clientId });
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.status(200).json(user);
  }

  // POST /api/users/me  { clientId }
  // создаёт пользователя, если его нет
  if (req.method === "POST") {
    const { clientId } = req.body;
    if (!clientId)
      return res.status(400).json({ error: "clientId is required" });

    const user = await User.findOneAndUpdate(
      { clientId },
      {
        $setOnInsert: {
          clientId,
          username: "Guest",
          avatarUrl: "",
          bio: "",
        },
      },
      { new: true, upsert: true }
    );

    return res.status(200).json(user);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
