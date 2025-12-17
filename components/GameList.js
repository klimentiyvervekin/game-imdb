import GameCard from "./GameCard";

export default function GameList({ games }) {
  return (
    <div className="grid">
      {games.map((game) => (
        <GameCard key={game._id} game={game} />
      ))}
    </div>
  );
}
