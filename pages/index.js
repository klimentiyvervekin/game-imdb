import useSWR from "swr";
import FeedList from "../components/FeedList";
import CreatePost from "@/components/CreatePost";
import SearchBar from "@/components/SearchBar";

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function HomePage() {
  const { data: games, error: gamesError } = useSWR("/api/games", fetcher);
  const {
    data: posts,
    error: postsError,
    mutate: mutatePosts,
  } = useSWR("/api/posts", fetcher);

  if (gamesError || postsError) return <p>Failed to load data</p>;
  if (!games || !posts) return <p>Loading...</p>;

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
