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
            width={240}
            height={180}
          />  // && means "show <Image> if game.coverUrl exist"
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

