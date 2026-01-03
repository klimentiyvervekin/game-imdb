import { dbConnect } from "../../../../db/connect";
import Post from "../../../../db/models/Post";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  const { clientId } = req.body;

  if (!clientId) return res.status(400).json({ error: "clientId is required" });

  await dbConnect();

  const post = await Post.findById(id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  // toggle like
  const liked = post.likedBy.includes(clientId);

  if (liked) {
    post.likedBy = post.likedBy.filter((x) => x !== clientId);
  } else {
    post.likedBy.push(clientId);
  }

  await post.save();

  return res.status(200).json({
    likesCount: post.likedBy.length,
    likedByMe: post.likedBy.includes(clientId),
  });
}
