import useSWR from "swr";
import Link from "next/link";

function getClientId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("clientId");
}

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function LikesPage() {
  const clientId = getClientId();

  const { data, error } = useSWR(
    clientId ? `/api/likes/${clientId}` : null,
    fetcher
  );

  if (!clientId) return <p>No clientId</p>;
  if (error) return <p>Failed to load likes</p>;
  if (!data) return <p>Loading...</p>;

  const { posts, comments, replies } = data;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h1>Liked content</h1>

      {/* POSTS */}
      <section style={{ marginTop: 20 }}>
        <h2>Posts</h2>
        {posts.length === 0 && <p>No liked posts</p>}

        {posts.map((p) => (
          <div key={p._id} style={{ borderBottom: "1px solid #eee", padding: 8 }}>
            <Link href={`/games/${p.gameId?.slug || ""}`}>
              {p.content.slice(0, 100)}
            </Link>
          </div>
        ))}
      </section>

      {/* COMMENTS */}
      <section style={{ marginTop: 20 }}>
        <h2>Comments</h2>
        {comments.length === 0 && <p>No liked comments</p>}

        {comments.map((c) => (
          <div key={c._id} style={{ borderBottom: "1px solid #eee", padding: 8 }}>
            {c.text}
          </div>
        ))}
      </section>

      {/* REPLIES */}
      <section style={{ marginTop: 20 }}>
        <h2>Replies</h2>
        {replies.length === 0 && <p>No liked replies</p>}

        {replies.map((r) => (
          <div key={r._id} style={{ borderBottom: "1px solid #eee", padding: 8 }}>
            {r.text}
          </div>
        ))}
      </section>
    </div>
  );
}
