import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

function getClientId() {
  if (typeof window === "undefined") return null;

  let id = localStorage.getItem("clientId");
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem("clientId", id);
  }
  return id;
}

export default function PostCard({ post, onChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(post.content || "");
  const [loading, setLoading] = useState(false);

  const game = post.gameId; // после populate это объект: {title, slug, _id}

  // считаем сколько лайков и лайкнул ли я
  const clientId = getClientId();
  const likesCount = Array.isArray(post.likedBy) ? post.likedBy.length : 0;
  const likedByMe =
    clientId && Array.isArray(post.likedBy) && post.likedBy.includes(clientId);

  async function del(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    const ok = confirm("Delete this post?");
    if (!ok) return;

    setLoading(true);
    const res = await fetch(`/api/posts/${post._id}`, { method: "DELETE" });
    setLoading(false);

    if (!res.ok) return alert("Failed to delete post");

    onChange?.();
  }

  async function toggleLike(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (!clientId) return alert("No clientId");

    setLoading(true);
    const res = await fetch(`/api/posts/${post._id}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId }),
    });
    setLoading(false);

    if (!res.ok) return alert("Failed to like");

    onChange?.(); // обновит посты через SWR mutate
  }

  async function save(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    const trimmed = text.trim();
    if (!trimmed) return alert("Post content cannot be empty");

    const game = post.gameId;
    const gameId = typeof game === "object" ? game._id : game;

    setLoading(true);
    const res = await fetch(`/api/posts/${post._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: trimmed, gameId }),
    });
    setLoading(false);

    if (!res.ok) return alert("Failed to update post");

    setIsEditing(false);
    onChange?.();
  }

  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 10 }}>
      <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>
        {game?.slug ? (
          <Link href={`/games/${game.slug}`}>
            Related to: {game.title || game.slug}
          </Link>
        ) : (
          <span>Related to: (unknown game)</span>
        )}
      </div>

      {!isEditing ? (
        <>
          <small style={{ opacity: 0.6 }}>
            {new Date(post.createdAt).toLocaleString()}
          </small>

          <p style={{ marginTop: 0 }}>{post.content}</p>

          {post.imageUrl && (
            <Image
              src={post.imageUrl}
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

          {post.videoUrl && (
            <video
              src={post.videoUrl}
              controls
              style={{ width: "100%", borderRadius: 10, marginTop: 8 }}
            />
          )}
        </>
      ) : (
        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ width: "100%" }}
        />
      )}

      <div style={{ display: "flex", gap: 8 }}>
        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            disabled={loading}
          >
            Edit
          </button>
        ) : (
          <>
            <button type="button" onClick={save} disabled={loading}>
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={loading}
            >
              Cancel
            </button>
          </>
        )}

        <button type="button" onClick={del} disabled={loading}>
          Delete
        </button>

        <button type="button" onClick={toggleLike} disabled={loading}>
          {likedByMe ? "Unlike" : "Like"} ({likesCount})
        </button>
      </div>
    </div>
  );
}
