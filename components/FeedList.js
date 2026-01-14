import styled from "styled-components";
import GameCard from "./GameCard";
import PostCard from "./PostCard";
import { Heart } from "lucide-react";

export default function FeedList({ games = [], posts = [], onPostsChange }) {
  const safeGames = Array.isArray(games) ? games : [];
  const safePosts = Array.isArray(posts) ? posts : [];

  const handlePostsChange =
    typeof onPostsChange === "function" ? onPostsChange : () => {};

  // отдельно сортируем (чтобы в каждой колонке было "новое сверху")
  const sortedPosts = [...safePosts].sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  });

  const sortedGames = [...safeGames].sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  });

  return (
    <Layout>
      <Left>
        <ColumnGrid>
          {sortedPosts.map((p) => (
            <Item key={`post-${p._id}`}>
              <PostCard post={p} onChange={handlePostsChange} />
            </Item>
          ))}
        </ColumnGrid>
      </Left>

      <Right>
        <ColumnGrid>
          {sortedGames.map((g) => (
            <Item key={`game-${g._id}`}>
              <GameCard game={g} />
            </Item>
          ))}
        </ColumnGrid>
      </Right>
    </Layout>
  );
}

/* ===================== styles ===================== */

const Layout = styled.section`
  display: grid;
  grid-template-columns: 1fr 360px; /* слева широкий фид, справа колонка игр */
  gap: 16px;
  align-items: start;

  @media (max-width: 980px) {
    grid-template-columns: 1fr; /* на мобиле друг под другом */
  }
`;

const Left = styled.div`
  min-width: 0;
`;

const Right = styled.aside`
  min-width: 0;

  @media (max-width: 980px) {
    order: 2; /* игры вниз на мобиле */
  }
`;

const ColumnGrid = styled.div`
  display: grid;
  gap: 16px;
`;

const Item = styled.div`
  min-width: 0;
`;
