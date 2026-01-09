import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";

const isMine = c.authorId === myUserId;
const isMineReply = r.authorId === myUserId;

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

  const { data: session } = useSession();
  const myUserId = session?.user?.dbUserId || null;

  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(post.content || "");
  const [loading, setLoading] = useState(false);

  // comment form
  const [commentText, setCommentText] = useState("");
  const [commentImageFile, setCommentImageFile] = useState(null);

  // reply form (one open per post, under one comment at a time)
  const [replyOpenForId, setReplyOpenForId] = useState(null); // commentId
  const [replyText, setReplyText] = useState("");
  const [replyImageFile, setReplyImageFile] = useState(null);
  const [replyTo, setReplyTo] = useState(null); // { commentId, replyToId }

  // post edit media
  const [newImageFile, setNewImageFile] = useState(null);
  const [newVideoFile, setNewVideoFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [removeVideo, setRemoveVideo] = useState(false);

  // for Cancel post edit
  const [originalPost, setOriginalPost] = useState(null);

  const game = post.gameId;

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
    try {
      const res = await fetch(`/api/posts/${post._id}`, { method: "DELETE" });
      if (!res.ok) return alert("Failed to delete post");
      onChange?.();
    } finally {
      setLoading(false);
    }
  }

  async function toggleLike(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (!clientId) return alert("No clientId");

    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${post._id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      if (!res.ok) return alert("Failed to like");
      onChange?.();
    } finally {
      setLoading(false);
    }
  }

  function startEdit() {
    setOriginalPost({
      content: post.content || "",
      imageUrl: post.imageUrl || "",
      videoUrl: post.videoUrl || "",
    });

    setText(post.content || "");

    setNewImageFile(null);
    setNewVideoFile(null);
    setRemoveImage(false);
    setRemoveVideo(false);

    setIsEditing(true);
  }

  function cancelEdit() {
    if (originalPost) {
      setText(originalPost.content || "");
    }
    setNewImageFile(null);
    setNewVideoFile(null);
    setRemoveImage(false);
    setRemoveVideo(false);

    setIsEditing(false);
    setOriginalPost(null);
  }

  async function save(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    const trimmed = text.trim();
    if (!trimmed) return alert("Post content cannot be empty");

    const gameObj = post.gameId;
    const gameId = typeof gameObj === "object" ? gameObj._id : gameObj;

    setLoading(true);
    try {
      let imageUrlToSend = undefined; // undefined = don't change
      let videoUrlToSend = undefined;

      if (removeImage) imageUrlToSend = "";
      if (removeVideo) videoUrlToSend = "";

      if (newImageFile) {
        imageUrlToSend = await uploadToCloudinary(newImageFile, "image");
      }
      if (newVideoFile) {
        videoUrlToSend = await uploadToCloudinary(newVideoFile, "video");
      }

      const res = await fetch(`/api/posts/${post._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: trimmed,
          gameId,
          ...(imageUrlToSend !== undefined ? { imageUrl: imageUrlToSend } : {}),
          ...(videoUrlToSend !== undefined ? { videoUrl: videoUrlToSend } : {}),
        }),
      });

      if (!res.ok) return alert("Failed to update post");

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
    if (!clientId) return alert("No clientId");

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
      onChange?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteComment(commentId) {
    const clientId = getClientId();
    if (!clientId) return alert("No clientId");

    const ok = confirm("Delete this comment?");
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${post._id}/comments/${commentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });

      if (!res.ok) return alert("Failed to delete comment");
      onChange?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitReply(commentId) {
    const clientId = getClientId();
    if (!clientId) return alert("No clientId");

    const trimmed = replyText.trim();
    if (!trimmed) return;

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
            replyToId: replyTo?.replyToId || null,
          }),
        }
      );

      if (!res.ok) return alert("Failed to reply");

      setReplyText("");
      setReplyImageFile(null);
      setReplyOpenForId(null);
      setReplyTo(null);
      onChange?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteReply(commentId, replyId) {
    const clientId = getClientId();
    if (!clientId) return alert("No clientId");

    const ok = confirm("Delete this reply?");
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/posts/${post._id}/comments/${commentId}/replies/${replyId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId }),
        }
      );

      if (!res.ok) return alert("Failed to delete reply");
      onChange?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ✅ LIKE COMMENT (toggle)
  async function toggleCommentLike(commentId) {
    const clientId = getClientId();
    if (!clientId) return alert("No clientId");

    setLoading(true);
    try {
      const res = await fetch(
        `/api/posts/${post._id}/comments/${commentId}/like`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId }),
        }
      );

      if (!res.ok) return alert("Failed to like comment");
      onChange?.();
    } finally {
      setLoading(false);
    }
  }

  // ✅ LIKE REPLY (toggle)
  async function toggleReplyLike(commentId, replyId) {
    const clientId = getClientId();
    if (!clientId) return alert("No clientId");

    setLoading(true);
    try {
      const res = await fetch(
        `/api/posts/${post._id}/comments/${commentId}/replies/${replyId}/like`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId }),
        }
      );

      if (!res.ok) return alert("Failed to like reply");
      onChange?.();
    } finally {
      setLoading(false);
    }
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

      {/* ================= VIEW MODE ================= */}
      {!isEditing && (
        <>
          <small style={{ opacity: 0.6 }}>
            {new Date(post.createdAt).toLocaleString()}
          </small>

          <Link
            href={`/users/${post.authorId}`}
            style={{ fontSize: 12, opacity: 0.7 }}
          >
            Author profile
          </Link>

          <p style={{ marginTop: 0 }}>{post.content}</p>

          {post.imageUrl && (
            <Image
              src={post.imageUrl}
              alt=""
              width={800}
              height={450}
              style={{ width: "100%", height: "auto", borderRadius: 10 }}
            />
          )}

          {post.videoUrl && (
            <video
              src={post.videoUrl}
              controls
              style={{ width: "100%", borderRadius: 10, marginTop: 8 }}
            />
          )}

          {/* POST ACTIONS */}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button type="button" onClick={startEdit} disabled={loading}>
              Edit
            </button>

            <button type="button" onClick={del} disabled={loading}>
              Delete
            </button>

            <button type="button" onClick={toggleLike} disabled={loading}>
              {likedByMe ? "Unlike" : "Like"} ({likesCount})
            </button>
          </div>

          {/* COMMENT FORM */}
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

          {/* COMMENTS LIST */}
          <div style={{ marginTop: 12 }}>
            <strong style={{ fontSize: 13 }}>Comments</strong>

            <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
              {(post.comments || []).map((c) => {
                const myId = getClientId();
                const isMine = c.authorId === myId;

                const commentLikes = Array.isArray(c.likedBy)
                  ? c.likedBy.length
                  : 0;
                const commentLikedByMe =
                  myId && Array.isArray(c.likedBy) && c.likedBy.includes(myId);

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

                    <Link href={`/users/${c.authorId}`}>user</Link>

                    <div style={{ marginTop: 4 }}>{c.text}</div>

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
                        disabled={loading}
                      >
                        Reply
                      </button>

                      {/* ✅ COMMENT LIKE */}
                      <button
                        type="button"
                        onClick={() => toggleCommentLike(c._id)}
                        style={{ fontSize: 12 }}
                        disabled={loading}
                      >
                        {commentLikedByMe ? "Unlike" : "Like"} ({commentLikes})
                      </button>

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

                    {/* REPLIES LIST */}
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
                          const myId2 = getClientId();
                          const isMineReply = r.authorId === myId2;

                          const replyLikes = Array.isArray(r.likedBy)
                            ? r.likedBy.length
                            : 0;
                          const replyLikedByMe =
                            myId2 &&
                            Array.isArray(r.likedBy) &&
                            r.likedBy.includes(myId2);

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

                              {/* REPLY ACTIONS */}
                              <div
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  marginTop: 6,
                                }}
                              >
                                <button
                                  type="button"
                                  style={{ fontSize: 12 }}
                                  onClick={() => {
                                    setReplyOpenForId(c._id);
                                    setReplyText("");
                                    setReplyImageFile(null);
                                    setReplyTo({
                                      commentId: c._id,
                                      replyToId: r._id,
                                    });
                                  }}
                                  disabled={loading}
                                >
                                  Reply
                                </button>

                                {/* ✅ REPLY LIKE */}
                                <button
                                  type="button"
                                  onClick={() => toggleReplyLike(c._id, r._id)}
                                  style={{ fontSize: 12 }}
                                  disabled={loading}
                                >
                                  {replyLikedByMe ? "Unlike" : "Like"} (
                                  {replyLikes})
                                </button>

                                {isMineReply && (
                                  <button
                                    type="button"
                                    onClick={() => deleteReply(c._id, r._id)}
                                    style={{
                                      fontSize: 12,
                                      color: "crimson",
                                    }}
                                    disabled={loading}
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* REPLY FORM (under comment) */}
                    {replyOpenForId === c._id && (
                      <div
                        style={{
                          display: "grid",
                          gap: 6,
                          marginTop: 8,
                          marginLeft: 16,
                        }}
                      >
                        <div style={{ display: "flex", gap: 8 }}>
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

                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                          }}
                        >
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
                              disabled={loading}
                            >
                              Remove image
                            </button>
                          )}
                        </div>
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
      )}

      {/* ================= EDIT MODE ================= */}
      {isEditing && (
        <>
          <textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ width: "100%" }}
          />

          {/* CURRENT IMAGE */}
          {post.imageUrl && !removeImage && (
            <div style={{ marginTop: 8 }}>
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
                style={{ marginTop: 6 }}
              >
                Remove image
              </button>
            </div>
          )}

          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>New image</div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                setNewImageFile(e.target.files?.[0] || null);
                setRemoveImage(false);
              }}
            />
          </div>

          {/* CURRENT VIDEO */}
          {post.videoUrl && !removeVideo && (
            <div style={{ marginTop: 8 }}>
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
                style={{ marginTop: 6 }}
              >
                Remove video
              </button>
            </div>
          )}

          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>New video</div>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => {
                setNewVideoFile(e.target.files?.[0] || null);
                setRemoveVideo(false);
              }}
            />
          </div>

          {/* SAVE / CANCEL */}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button type="button" onClick={save} disabled={loading}>
              Save changes
            </button>

            <button type="button" onClick={cancelEdit} disabled={loading}>
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
