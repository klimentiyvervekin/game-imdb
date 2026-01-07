import PostCard from "./PostCard";
import styled from "styled-components";

export default function PostList({ posts = [], onPostsChange }) {
  return (
    <Grid>    
      {posts.map((post) => (
        <PostCard key={post._id} post={post} onChange={onPostsChange} />
      ))}
    </Grid>
  );
}

const Grid = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
`;
