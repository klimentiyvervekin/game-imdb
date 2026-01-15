// components/FeedList.js
import { useState } from "react";
import styled from "styled-components";
import GameCard from "./GameCard";
import PostCard from "./PostCard";

export default function FeedList({ games = [], posts = [], onPostsChange }) {
  const safeGames = Array.isArray(games) ? games : [];
  const safePosts = Array.isArray(posts) ? posts : [];

  const handlePostsChange =
    typeof onPostsChange === "function" ? onPostsChange : () => {};

  const [mobileTab, setMobileTab] = useState("posts"); // posts | games

  const sortedPosts = [...safePosts].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  const sortedGames = [...safeGames].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  return (
    <>
      {/* MOBILE TABS */}
      <MobileTabs>
        <TabButton
          className={mobileTab === "posts" ? "active" : ""}
          onClick={() => setMobileTab("posts")}
        >
          Posts
        </TabButton>

        <TabButton
          className={mobileTab === "games" ? "active" : ""}
          onClick={() => setMobileTab("games")}
        >
          Games
        </TabButton>
      </MobileTabs>

      <Layout>
        <Left className={mobileTab !== "posts" ? "hidden" : ""}>
          <ColumnGrid>
            {sortedPosts.map((p) => (
              <Item key={`post-${p._id}`}>
                <PostCard post={p} onChange={handlePostsChange} />
              </Item>
            ))}
          </ColumnGrid>
        </Left>

        <Right className={mobileTab !== "games" ? "hidden" : ""}>
          <ColumnGrid>
            {sortedGames.map((g) => (
              <Item key={`game-${g._id}`}>
                <GameCard game={g} />
              </Item>
            ))}
          </ColumnGrid>
        </Right>
      </Layout>
    </>
  );
}

/* ===================== styles ===================== */

const Layout = styled.section`
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 16px;
  align-items: start;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const MobileTabs = styled.div`
  display: none;
  margin-bottom: 12px;

  @media (max-width: 980px) {
    display: flex;
    gap: 8px;
  }
`;

const TabButton = styled.button`
  flex: 1; /* ВАЖНО: одинаковая ширина */
  appearance: none;
  border: 1px solid var(--color-border);
  background: #f3f4f6;
  color: var(--color-text);

  font-size: 14px;
  font-weight: 600;
  padding: 10px 0;
  border-radius: 999px;
  cursor: pointer;
  text-align: center;

  &:hover {
    background: #e5e7eb;
  }

  &.active {
    background: rgba(79, 70, 229, 0.12); /* светло-синий */
    color: var(--color-primary);
    border-color: rgba(79, 70, 229, 0.35);
    font-weight: 700;
  }
`;

const Left = styled.div`
  min-width: 0;

  @media (max-width: 980px) {
    &.hidden {
      display: none;
    }
  }
`;

const Right = styled.aside`
  min-width: 0;

  @media (max-width: 980px) {
    &.hidden {
      display: none;
    }
  }
`;

const ColumnGrid = styled.div`
  display: grid;
  gap: 16px;
`;

const Item = styled.div`
  min-width: 0;
`;
