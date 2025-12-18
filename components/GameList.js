import styled from "styled-components";
import GameCard from "./GameCard";

export default function GameList({ games }) {
  return (
    <Grid>
      {games.map((game) => (
        <GameCard key={game._id} game={game} />
      ))}
    </Grid>
  );
}

const Grid = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
`;
