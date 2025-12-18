import Link from "next/link";
import Image from "next/image";

export default function PostCard({ post }) {
  const game = post.gameId;

  return (
    <div className="card">
      <p>{post.content}</p>

      {post.imageUrl && (
        <Image
          src={post.imageUrl}
          alt="Post image"
          width={300}
          height={200}
          style={{ objectFit: "cover" }}
        />
      )}

      {game && game.slug && (
        <Link href={`/games/${game.slug}`}>
          <a>Go to {game.title}</a>
        </Link>
      )}
    </div>
  );
}
