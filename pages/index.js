import useSWR from "swr";
import GameList from "../components/GameList";
import PostList from "../components/PostList";

export default function HomePage() {
  const { data: games, error: gamesError } = useSWR("/api/games");
  const { data: posts, error: postsError } = useSWR("/api/posts");

  if (gamesError || postsError) {
    return <p>Failed to load data</p>;
  }

  if (!games || !posts) {
    return <p>Loading...</p>;
  }

  return (
    <main>
      <section>
        <h2>Games</h2>
        {games.length === 0 ? <p>No games yet</p> : <GameList games={games} />}
      </section>

      <section>
        <h2>Latest posts</h2>
        {posts.length === 0 ? <p>No posts yet</p> : <PostList posts={posts} />}
      </section>
    </main>
  );
}
