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

  const [commentText, setCommentText] = useState("");

  const [replyOpenForId, setReplyOpenForId] = useState(null);
  const [replyText, setReplyText] = useState("");

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

  async function submitComment(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    const clientId = getClientId();
    const trimmed = commentText.trim();
    if (!trimmed) return;

    setLoading(true);

    const res = await fetch(`/api/posts/${post._id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, text: trimmed }),
    });

    setLoading(false);

    if (!res.ok) return alert("Failed to add comment");

    setCommentText("");
    onChange?.(); // подтянет обновлённые посты через mutate
  }

  async function deleteComment(commentId) {
    const clientId = getClientId();
    if (!clientId) return;

    const ok = confirm("Delete this comment?");
    if (!ok) return;

    setLoading(true);
    const res = await fetch(`/api/posts/${post._id}/comments/${commentId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId }),
    });
    setLoading(false);

    if (!res.ok) {
      alert("Failed to delete comment");
      return;
    }

    onChange?.(); // обновляем посты
  }

  async function submitReply(commentId) {
    const clientId = getClientId();
    const trimmed = replyText.trim();
    if (!trimmed) return;

    setLoading(true);
    const res = await fetch(
      `/api/posts/${post._id}/comments/${commentId}/replies`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, text: trimmed }),
      }
    );
    setLoading(false);

    if (!res.ok) return alert("Failed to reply");

    setReplyText("");
    setReplyOpenForId(null);
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

          <div style={{ marginTop: 10 }}>
            <strong style={{ fontSize: 13 }}>Comments</strong>

            <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
              {(post.comments || []).map((c) => {
                const clientId = getClientId();
                const isMine = c.authorId === clientId;

                return (
                  <div
                    key={c._id}
                    style={{
                      padding: 8,
                      border: "1px solid #eee",
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                      {new Date(c.createdAt).toLocaleString()}
                    </div>

                    <div style={{ marginTop: 4 }}>{c.text}</div>

                    {/* replies list */}
                    {Array.isArray(c.replies) && c.replies.length > 0 && (
                      <div
                        style={{
                          marginTop: 6,
                          marginLeft: 16,
                          display: "grid",
                          gap: 6,
                        }}
                      >
                        {c.replies.map((r) => (
                          <div
                            key={r._id}
                            style={{
                              padding: 8,
                              border: "1px solid #f0f0f0",
                              borderRadius: 8,
                            }}
                          >
                            <div style={{ fontSize: 12, opacity: 0.7 }}>
                              {new Date(r.createdAt).toLocaleString()}
                            </div>
                            <div>{r.text}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply button */}
                    <button
                      type="button"
                      onClick={() => {
                        setReplyOpenForId(
                          replyOpenForId === c._id ? null : c._id
                        );
                        setReplyText("");
                      }}
                      style={{ marginTop: 6, fontSize: 12 }}
                    >
                      Reply
                    </button>

                    {/* Reply form */}
                    {replyOpenForId === c._id && (
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          marginTop: 6,
                          marginLeft: 16,
                        }}
                      >
                        <input
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write a reply..."
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          onClick={() => submitReply(c._id)}
                          disabled={loading}
                        >
                          Send
                        </button>
                      </div>
                    )}

                    {isMine && (
                      <button
                        type="button"
                        onClick={() => deleteComment(c._id)}
                        style={{ marginTop: 4, fontSize: 12, color: "crimson" }}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                );
              })}

              {(post.comments || []).length === 0 && (
                <div style={{ fontSize: 13, opacity: 0.7 }}>
                  No comments yet
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                style={{ flex: 1 }}
              />
              <button type="button" onClick={submitComment} disabled={loading}>
                Send
              </button>
            </div>
          </div>
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
