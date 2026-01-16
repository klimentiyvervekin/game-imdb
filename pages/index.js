import useSWR from "swr";
import FeedList from "../components/FeedList";
import CreatePost from "@/components/CreatePost";
import SearchBar from "@/components/SearchBar";
import styled from "styled-components";

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function HomePage() {
  const { data: games, error: gamesError } = useSWR("/api/games", fetcher);
  const {
    data: posts,
    error: postsError,
    mutate: mutatePosts,
  } = useSWR("/api/posts", fetcher);

  if (gamesError || postsError) return <p>Failed to load data</p>;

  if (!games || !posts) {
    return (
      <InlineState>
        <InlineTitle>Loading…</InlineTitle>
        <InlineText>Please wait while data is loading</InlineText>
      </InlineState>
    );
  }

  return (
    <main style={{ padding: 16, display: "grid", gap: 16 }}>
      <SearchBar />

      <CreatePost onCreated={() => mutatePosts()} />

      {games.length === 0 && posts.length === 0 ? (
        <p>No games yet / No posts yet</p>
      ) : (
        <FeedList
          games={games}
          posts={posts}
          onPostsChange={() => mutatePosts()}
        />
      )}
    </main>
  );
}

const InlineState = styled.div`
  margin: 48px auto;
  padding: 28px 22px;
  max-width: 520px;

  border: 1px dashed #e5e7eb;
  border-radius: 12px;
  background: rgba(17, 24, 39, 0.02);

  text-align: center;
`;

const InlineTitle = styled.div`
  font-size: 16px;
  font-weight: 800;
  color: #111827;
`;

const InlineText = styled.div`
  margin-top: 6px;
  font-size: 13px;
  color: #6b7280;
`;
