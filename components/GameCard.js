import Link from "next/link";
import Image from "next/image";
import styled from "styled-components";
import { Heart } from "lucide-react";

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
          /> // && means "show <Image> if game.coverUrl exist"
        )}
        <Title>{game.title}</Title>
      </Card>
    </Link>
  );
}

const Card = styled.article`
  --color-surface: #ffffff;
  --color-text: #111827;
  --color-border: #e5e7eb;
  --color-border-strong: #d1d5db;

  --radius-md: 12px;
  --radius-sm: 10px;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);

  /* title UNDER image */
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;

  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);

  cursor: pointer;
  color: var(--color-text);
  text-decoration: none;

  transition: transform 0.12s ease, box-shadow 0.12s ease,
    border-color 0.12s ease;

  /* Next <Image> wraps image in a span — make it full width */
  > span {
    display: block !important;
    width: 100% !important;
    border-radius: var(--radius-sm);
    overflow: hidden;
    background: rgba(17, 24, 39, 0.04);
  }

  /* make the actual img fill the wrapper */
  img {
    display: block;
    width: 100% !important;
    height: auto !important;
    object-fit: cover;
  }

  &:hover {
    border-color: var(--color-border-strong);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.07);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 520px) {
    padding: 10px;
    gap: 8px;
  }
`;

const Title = styled.h3`
  margin: 0;
  padding: 0 2px;

  font-size: 14px;
  font-weight: 800;
  line-height: 1.3;
  color: #111827;

  /* show the name properly under the image */
  word-break: break-word;

  /* максимум 2 строки, чтобы сетка не прыгала */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  @media (min-width: 768px) {
    font-size: 15px;
  }
`;
