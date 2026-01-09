import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";

import { dbConnect } from "../../../../db/connect";
import Post from "../../../../db/models/Post";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.dbUserId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { id } = req.query;
  await dbConnect();

  if (req.method === "POST") {
    const { text, imageUrl = "" } = req.body;

    const trimmed = (text || "").trim();
    if (!trimmed) return res.status(400).json({ error: "Comment cannot be empty" });

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    post.comments.push({
      authorId: userId,
      text: trimmed,
      imageUrl,
    });

    await post.save();

    const populated = await Post.findById(id).populate("gameId", "title slug");
    return res.status(200).json(populated);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
