import styled from "styled-components";
import GameCard from "./GameCard";
import PostCard from "./PostCard";

export default function FeedList({ games = [], posts = [] }) {
  const feed = [
    ...games.map((g) => ({ type: "game", ...g })), // choose every game and change it a little bit (write "type: game")
    ...posts.map((p) => ({ type: "post", ...p })), // i need this to make return easier than "map" 2 times
  ];

return (
  <Grid>
    {feed.map((item) => (
      <Item key={`${item.type}-${item._id}`}>
        {item.type === "game" ? (
          <GameCard game={item} />
        ) : (
          <PostCard post={item} />
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
