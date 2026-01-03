import { dbConnect } from "../../../db/connect";
import Post from "../../../db/models/Post";

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    await dbConnect();

    if (req.method === "DELETE") {
      const deleted = await Post.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ error: "Post not found" });
      return res.status(200).json({ ok: true });
    }

    if (req.method === "PATCH") {
      const { content, imageUrl, videoUrl } = req.body;

      const trimmed = (content || "").trim();
      if (!trimmed) return res.status(400).json({ error: "Post content cannot be empty" });

      const updated = await Post.findByIdAndUpdate(
        id,
        { content: trimmed, imageUrl: imageUrl || "", videoUrl: videoUrl || "" },
        { new: true }
      ).populate("gameId", "title slug");

      if (!updated) return res.status(404).json({ error: "Post not found" });
      return res.status(200).json(updated);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("POSTS [id] ERROR:", error);
    return res.status(500).json({ error: error.message, name: error.name });
  }
}
