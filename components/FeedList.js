import styled from "styled-components";
import GameCard from "./GameCard";
import PostCard from "./PostCard";

export default function FeedList({ games = [], posts = [] }) {
  const feed = [...games, ...posts];

  return (
    <Grid>
      {feed.map((item) => {
        const isGame = item.slug && item.title && item.externalId !== undefined; // грубая проверка
        return (
          <Item key={item._id}>
            {isGame ? <GameCard game={item} /> : <PostCard post={item} />}
          </Item>
        );
      })}
    </Grid>
  );
}

const Grid = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
`;

const Item = styled.div``;
