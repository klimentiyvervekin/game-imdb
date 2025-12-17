import Link from "next/link";
import Image from "next/image";
import styled from "styled-components";

export default function GameCard({ game }) {
  return (
    <Link href={`/games/${game.slug}`}>
      <Card>
        {game.coverUrl && (
          <Image
            src={game.coverUrl}
            alt={game.title}
            width={120}
            height={90}
          />
        )}
        <Title>{game.title}</Title>
      </Card>
    </Link>
  );
}

const Card = styled.article`
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 1px solid #ddd;
  cursor: pointer;
`;

const Title = styled.h3`
  margin: 0;
`;

