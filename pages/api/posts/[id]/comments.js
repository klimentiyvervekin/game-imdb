import { dbConnect } from "../../../../db/connect";
import Post from "../../../../db/models/Post";

export default async function handler(req, res) {
  const { id } = req.query;

  await dbConnect();

  if (req.method === "POST") {
    const { clientId, text } = req.body;

    const trimmed = (text || "").trim();
    if (!clientId) return res.status(400).json({ error: "clientId is required" });
    if (!trimmed) return res.status(400).json({ error: "Comment cannot be empty" });

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    post.comments.push({
      authorId: clientId,
      text: trimmed,
    });

    await post.save();

    // вернём обновлённый пост (чтобы UI сразу обновился)
    const populated = await Post.findById(id).populate("gameId", "title slug");
    return res.status(200).json(populated);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
