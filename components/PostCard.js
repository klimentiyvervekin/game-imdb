import { useState } from "react";
import Link from "next/link";

export default function PostCard({ post, onChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(post.content || "");
  const [loading, setLoading] = useState(false);

  const game = post.gameId; // после populate это объект: {title, slug, _id}

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

  async function save(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    
    const trimmed = text.trim();
    if (!trimmed) return alert("Post content cannot be empty");

    setLoading(true);
    const res = await fetch(`/api/posts/${post._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: trimmed }),
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
          <Link href={`/games/${game.slug}`}>Related to: {game.title || game.slug}</Link>
        ) : (
          <span>Related to: (unknown game)</span>
        )}
      </div>

      {!isEditing ? (
        <p style={{ marginTop: 0 }}>{post.content}</p>
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
          <button type="button" onClick={() => setIsEditing(true)} disabled={loading}>
            Edit
          </button>
        ) : (
          <>
            <button type="button" onClick={save} disabled={loading}>
              Save
            </button>
            <button type="button" onClick={() => setIsEditing(false)} disabled={loading}>
              Cancel
            </button>
          </>
        )}

        <button type="button" onClick={del} disabled={loading}>
          Delete
        </button>
      </div>
    </div>
  );
}
