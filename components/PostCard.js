import Link from "next/link";

export default function PostCard({ post }) {
  const game = post.gameId; // if u do populate

  return (
    <div className="card">
      <p>{post.content}</p>
      {post.imageUrl && <img src={post.imageUrl} alt="" width="240" />}

      {game?.slug && (
        <Link href={`/games/${game.slug}`}>
          Go to {game.title || game.slug}
        </Link>
      )}
    </div>
  );
}
