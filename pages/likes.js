// pages/likes.js
import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";

const fetcher = (url) => fetch(url).then((r) => r.json());

// если есть author._id - делаем ссылку, если нет - просто текст (тоже не надо)
function AuthorLink({ author }) {
  if (!author?._id) return <span>{author?.name || "User"}</span>;
  return <Link href={`/users/${author._id}`}>{author.name || "User"}</Link>;
}

export default function LikesPage() {
  const { data: session, status } = useSession();
  const myUserId = session?.user?.dbUserId || null; // mongo user

  const { data, error, mutate } = useSWR(
    status === "authenticated" ? "/api/likes/me" : null,
    fetcher
  );

  if (status === "loading") return <p>Loading...</p>;

  if (!myUserId) {
    return <p>Please log in or sign in to see your likes.</p>;
  }

  if (error) return <p>Failed to load likes</p>;
  if (!data) return <p>Loading...</p>;

  const posts = Array.isArray(data.posts) ? data.posts : [];
  const comments = Array.isArray(data.comments) ? data.comments : [];
  const replies = Array.isArray(data.replies) ? data.replies : [];

  async function unlikePost(postId) {
    await fetch(`/api/posts/${postId}/like`, { method: "POST" });
    mutate();
  }

  async function unlikeComment(postId, commentId) {
    await fetch(`/api/posts/${postId}/comments/${commentId}/like`, {
      method: "POST",
    });
    mutate();
  }

  async function unlikeReply(postId, commentId, replyId) {
    await fetch(
      `/api/posts/${postId}/comments/${commentId}/replies/${replyId}/like`,
      { method: "POST" }
    );
    mutate();
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h1>Liked content</h1>

      {/* POSTS */}
      <section style={{ marginTop: 20 }}>
        <h2>Posts</h2>
        {posts.length === 0 && <p>No liked posts</p>}

        {posts.map((p) => (
          <div
            key={p._id}
            style={{
              border: "1px solid #eee",
              borderRadius: 10,
              padding: 12,
              marginTop: 10,
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              {p.gameId?.slug ? (
                <Link href={`/games/${p.gameId.slug}`}>
                  Open game: {p.gameId.title || p.gameId.slug}
                </Link>
              ) : (
                <span>(no game)</span>
              )}
            </div>

            <div style={{ marginTop: 6 }}>
              {(p.content || "").slice(0, 200)}
            </div>

            {p.imageUrl && (
              <Image
                src={p.imageUrl}
                alt=""
                width={800}
                height={450}
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: 10,
                  marginTop: 8,
                }}
              />
            )}

            <div style={{ marginTop: 10 }}>
              <button type="button" onClick={() => unlikePost(p._id)}>
                Unlike
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* COMMENTS */}
      <section style={{ marginTop: 20 }}>
        <h2>Comments</h2>
        {comments.length === 0 && <p>No liked comments</p>}

        {comments.map((c) => (
          <div
            key={c._id}
            style={{
              border: "1px solid #eee",
              borderRadius: 10,
              padding: 12,
              marginTop: 10,
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              {c.game?.slug ? (
                <Link href={`/games/${c.game.slug}`}>
                  Open game: {c.game.title || c.game.slug}
                </Link>
              ) : (
                <span>(no game)</span>
              )}
            </div>

            {/* ссылка */}
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
              Author: <AuthorLink author={c.author} />
            </div>

            <div style={{ marginTop: 6 }}>{c.text}</div>

            {c.imageUrl && (
              <Image
                src={c.imageUrl}
                alt=""
                width={800}
                height={450}
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: 10,
                  marginTop: 8,
                }}
              />
            )}

            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                onClick={() => unlikeComment(c.postId, c._id)}
              >
                Unlike
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* REPLIES */}
      <section style={{ marginTop: 20 }}>
        <h2>Replies</h2>
        {replies.length === 0 && <p>No liked replies</p>}

        {replies.map((r) => (
          <div
            key={r._id}
            style={{
              border: "1px solid #eee",
              borderRadius: 10,
              padding: 12,
              marginTop: 10,
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              {r.game?.slug ? (
                <Link href={`/games/${r.game.slug}`}>
                  Open game: {r.game.title || r.game.slug}
                </Link>
              ) : (
                <span>(no game)</span>
              )}
            </div>

            {/* ссылка */}
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
              Author: <AuthorLink author={r.author} />
            </div>

            <div style={{ marginTop: 6 }}>{r.text}</div>

            {r.imageUrl && (
              <Image
                src={r.imageUrl}
                alt=""
                width={800}
                height={450}
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: 10,
                  marginTop: 8,
                }}
              />
            )}

            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                onClick={() => unlikeReply(r.postId, r.commentId, r._id)}
              >
                Unlike
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
