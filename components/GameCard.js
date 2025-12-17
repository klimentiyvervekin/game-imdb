import Link from "next/link";

export default function GameCard({ game }) {
  return (
    <Link href={`/games/${game.slug}`}>
      <div className="card">
        {game.coverUrl && <img src={game.coverUrl} alt={game.title} width="120" />}
        <h3>{game.title}</h3>
      </div>
    </Link>
  );
}
