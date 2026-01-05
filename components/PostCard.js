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

async function uploadToCloudinary(file, kind) {
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file: base64, kind }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Upload failed");
  return json.url;
}

export default function PostCard({ post, onChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(post.content || "");
  const [loading, setLoading] = useState(false);

  const [commentText, setCommentText] = useState("");
  const [commentImageFile, setCommentImageFile] = useState(null);

  const [replyOpenForId, setReplyOpenForId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyImageFile, setReplyImageFile] = useState(null);
  const [replyTo, setReplyTo] = useState(null); // objects like { commentId, replyToId }

  const [newImageFile, setNewImageFile] = useState(null);
  const [newVideoFile, setNewVideoFile] = useState(null);

  const [removeImage, setRemoveImage] = useState(false);
  const [removeVideo, setRemoveVideo] = useState(false);

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");

  const [originalPost, setOriginalPost] = useState(null);

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

    try {
      const trimmed = text.trim();
      if (!trimmed) return alert("Post content cannot be empty");

      const game = post.gameId;
      const gameId = typeof game === "object" ? game._id : game;

      setLoading(true);

      // объявляем переменные
      let imageUrlToSend = undefined; // undefined - не менять
      let videoUrlToSend = undefined;

      // если пользователь нажал remove
      if (removeImage) imageUrlToSend = ""; // удалить
      if (removeVideo) videoUrlToSend = "";

      // если выбрал новый файл - загружаем
      if (newImageFile)
        imageUrlToSend = await uploadToCloudinary(newImageFile, "image");
      if (newVideoFile)
        videoUrlToSend = await uploadToCloudinary(newVideoFile, "video");

      // send patch
      const res = await fetch(`/api/posts/${post._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: trimmed,
          gameId,
          ...(imageUrlToSend !== undefined ? { imageUrl: imageUrlToSend } : {}), // we send ONLY if we have this:
          ...(videoUrlToSend !== undefined ? { videoUrl: videoUrlToSend } : {}),
        }),
      });

      setLoading(false);

      if (!res.ok) throw new Error("Failed to update post");

      setIsEditing(false);
      setOriginalPost(null);
      onChange?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitComment(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    const clientId = getClientId();
    const trimmed = commentText.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      let imageUrl = "";
      if (commentImageFile) {
        imageUrl = await uploadToCloudinary(commentImageFile, "image");
      }

      const res = await fetch(`/api/posts/${post._id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, text: trimmed, imageUrl }),
      });

      if (!res.ok) return alert("Failed to add comment");

      setCommentText("");
      setCommentImageFile(null);
      onChange?.(); // подтянет обновлённые посты через mutate
    } finally {
      setLoading(false);
    }
  }

  async function saveCommentEdit(commentId) {
    const clientId = getClientId();
    const trimmed = editCommentText.trim();
    if (!trimmed) return alert("Comment cannot be empty");

    setLoading(true);
    const res = await fetch(`/api/posts/${post._id}/comments/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, text: trimmed }),
    });
    setLoading(false);

    if (!res.ok) return alert("Failed to edit comment");

    setEditingCommentId(null);
    setEditCommentText("");
    onChange?.();
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
    if (!trimmed) return; // not with "&& !replyImageFile"

    setLoading(true);
    try {
      let imageUrl = "";
      if (replyImageFile) {
        imageUrl = await uploadToCloudinary(replyImageFile, "image");
      }

      const res = await fetch(
        `/api/posts/${post._id}/comments/${commentId}/replies`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId,
            text: trimmed,
            imageUrl,
            replyToId: replyTo?.replyToId || null, // reply to reply comments and everything
          }),
        }
      );

      setLoading(false);
      if (!res.ok) return alert("Failed to reply");

      setReplyText("");
      setReplyImageFile(null);
      setReplyOpenForId(null);
      onChange?.();
    } catch (e) {
      setLoading(false);
      alert(e.message);
    }
  }

  async function deleteReply(commentId, replyId) {
    const clientId = getClientId();
    if (!clientId) return;

    const ok = confirm("Delete this reply?");
    if (!ok) return;

    setLoading(true);
    const res = await fetch(
      `/api/posts/${post._id}/comments/${commentId}/replies/${replyId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      }
    );
    setLoading(false);

    if (!res.ok) {
      alert("Failed to delete reply");
      return;
    }

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

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => {
                  setOriginalPost({
                    content: post.content,
                    imageUrl: post.imageUrl,
                    videoUrl: post.videoUrl,
                  });

                  setText(post.content);
                  setIsEditing(true);

                  setNewImageFile(null);
                  setNewVideoFile(null);
                  setRemoveImage(false);
                  setRemoveVideo(false);
                }}
                disabled={loading}
              >
                Edit
              </button>
            ) : (
              <>
                <button type="button" onClick={save} disabled={loading}>
                  Save changes
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (originalPost) {
                      setText(originalPost.content);
                      setRemoveImage(false);
                      setRemoveVideo(false);
                      setNewImageFile(null);
                      setNewVideoFile(null);
                    }

                    setIsEditing(false);
                    setOriginalPost(null);
                    disabled = { loading };
                  }}
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

          <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
            <div style={{ display: "flex", gap: 8 }}>
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

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setCommentImageFile(e.target.files?.[0] || null)
                }
              />

              {commentImageFile && (
                <button
                  type="button"
                  onClick={() => setCommentImageFile(null)}
                  disabled={loading}
                >
                  Remove image
                </button>
              )}
            </div>
          </div>

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

                    {editingCommentId !== c._id ? (
                      <div style={{ marginTop: 4 }}>{c.text}</div>
                    ) : (
                      <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
                        <input
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          style={{ width: "100%" }}
                        />

                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => saveCommentEdit(c._id)}
                            disabled={loading}
                          >
                            Save
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingCommentId(null);
                              setEditCommentText("");
                            }}
                            disabled={loading}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {c.imageUrl && (
                      <Image
                        src={c.imageUrl}
                        alt=""
                        width={600}
                        height={400}
                        style={{
                          width: "100%",
                          height: "auto",
                          borderRadius: 8,
                          marginTop: 6,
                        }}
                      />
                    )}

                    {/* COMMENT ACTIONS */}
                    <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyOpenForId(
                            replyOpenForId === c._id ? null : c._id
                          );
                          setReplyText("");
                          setReplyImageFile(null);
                          setReplyTo({ commentId: c._id, replyToId: null });
                        }}
                        style={{ fontSize: 12 }}
                      >
                        Reply
                      </button>

                      {isMine && editingCommentId !== c._id && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCommentId(c._id);
                            setEditCommentText(c.text);
                          }}
                          style={{ fontSize: 12 }}
                          disabled={loading}
                        >
                          Edit
                        </button>
                      )}

                      {isMine && (
                        <button
                          type="button"
                          onClick={() => deleteComment(c._id)}
                          style={{ fontSize: 12, color: "crimson" }}
                          disabled={loading}
                        >
                          Delete
                        </button>
                      )}
                    </div>

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
                        {c.replies.map((r) => {
                          const clientId = getClientId();
                          const isMineReply = r.authorId === clientId;

                          return (
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

                              {r.replyToId && (
                                <div style={{ fontSize: 12, opacity: 0.6 }}>
                                  Reply to: {String(r.replyToId).slice(-6)}
                                </div>
                              )}

                              <div style={{ marginTop: 4 }}>{r.text}</div>

                              <button
                                type="button"
                                style={{ marginTop: 6, fontSize: 12 }}
                                onClick={() => {
                                  setReplyOpenForId(c._id); // открываем форму под этим комментом
                                  setReplyText("");
                                  setReplyImageFile(null);
                                  setReplyTo({
                                    commentId: c._id,
                                    replyToId: r._id,
                                  }); //  отвечаем конкретному reply
                                }}
                              >
                                Reply
                              </button>

                              {r.imageUrl && (
                                <Image
                                  src={r.imageUrl}
                                  alt=""
                                  width={600}
                                  height={400}
                                  style={{
                                    width: "100%",
                                    height: "auto",
                                    borderRadius: 8,
                                    marginTop: 6,
                                  }}
                                />
                              )}

                              {isMineReply && (
                                <button
                                  type="button"
                                  onClick={() => deleteReply(c._id, r._id)}
                                  style={{
                                    marginTop: 4,
                                    fontSize: 12,
                                    color: "crimson",
                                  }}
                                  disabled={loading}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

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

                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setReplyImageFile(e.target.files?.[0] || null)
                          }
                        />

                        {replyImageFile && (
                          <button
                            type="button"
                            onClick={() => setReplyImageFile(null)}
                          >
                            Remove image
                          </button>
                        )}
                      </div>
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
          </div>
        </>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          <textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ width: "100%" }}
          />

          {/* CURRENT IMAGE */}
          {post.imageUrl && !removeImage && (
            <div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Current image</div>
              <Image
                src={post.imageUrl}
                alt=""
                width={800}
                height={450}
                style={{ width: "100%", height: "auto", borderRadius: 10 }}
              />
              <button
                type="button"
                onClick={() => setRemoveImage(true)}
                disabled={loading}
              >
                Remove image
              </button>
            </div>
          )}

          {removeImage && (
            <div style={{ fontSize: 12, color: "crimson" }}>
              Image will be removed
            </div>
          )}

          <label>
            New image
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                setNewImageFile(e.target.files?.[0] || null);
                setRemoveImage(false);
              }}
            />
          </label>

          {/* CURRENT VIDEO */}
          {post.videoUrl && !removeVideo && (
            <div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Current video</div>
              <video
                src={post.videoUrl}
                controls
                style={{ width: "100%", borderRadius: 10 }}
              />
              <button
                type="button"
                onClick={() => setRemoveVideo(true)}
                disabled={loading}
              >
                Remove video
              </button>
            </div>
          )}

          {removeVideo && (
            <div style={{ fontSize: 12, color: "crimson" }}>
              Video will be removed
            </div>
          )}

          <label>
            New video
            <input
              type="file"
              accept="video/*"
              onChange={(e) => {
                setNewVideoFile(e.target.files?.[0] || null);
                setRemoveVideo(false);
              }}
            />
          </label>
        </div>
      )}
    </div>
  );
}
