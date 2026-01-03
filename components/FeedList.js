import styled from "styled-components";
import GameCard from "./GameCard";
import PostCard from "./PostCard";

export default function FeedList({ games = [], posts = [], onPostsChange }) {
  const safeGames = Array.isArray(games) ? games : [];
  const safePosts = Array.isArray(posts) ? posts : [];

  const handlePostsChange =
    typeof onPostsChange === "function" ? onPostsChange : () => {};

  const feed = [
    ...safeGames.map((g) => ({ type: "game", ...g })),
    ...safePosts.map((p) => ({ type: "post", ...p })),
  ].sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime; // new to the up
  });

  return (
    <Grid>
      {feed.map((item) => (
        <Item key={`${item.type}-${item._id}`}>
          {item.type === "game" ? (
            <GameCard game={item} />
          ) : (
            <PostCard post={item} onChange={handlePostsChange} />
          )}
        </Item>
      ))}
    </Grid>
  );
}

const Grid = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
`;

const Item = styled.div``;
