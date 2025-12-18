import useSWR from "swr";
import FeedList from "../components/FeedList";

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function HomePage() {
  const { data: games, error: gamesError } = useSWR("/api/games", fetcher);
  const { data: posts, error: postsError } = useSWR("/api/posts", fetcher);

  if (gamesError || postsError) return <p>Failed to load data</p>;
  if (!games || !posts) return <p>Loading...</p>;

  if (games.length === 0 && posts.length === 0) return <p>No games yet / No posts yet</p>;

  return (
    <main style={{ padding: 16 }}>
      <FeedList games={games} posts={posts} />
    </main>
  );
}
