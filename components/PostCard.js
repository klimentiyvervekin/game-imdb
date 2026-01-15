// components/PostCard.js
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import styled from "styled-components";
import { Heart } from "lucide-react";

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

  // reply form
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

  const isMinePost = myUserId && String(post.authorId) === String(myUserId);

  const likesCount = Array.isArray(post.likedBy) ? post.likedBy.length : 0;
  const likedByMe =
    myUserId &&
    Array.isArray(post.likedBy) &&
    post.likedBy.includes(String(myUserId));

  function needLogin() {
    alert(
      "Please, log in or sign in, to write posts, like and comment"
    );
  }

  async function del(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (!myUserId) return needLogin();
    if (!isMinePost) return alert("Not allowed");

    const ok = confirm("Delete this post?");
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${post._id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return alert(json?.error || "Failed to delete post");
      onChange?.();
    } finally {
      setLoading(false);
    }
  }

  async function toggleLike(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (!myUserId) return needLogin();

    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${post._id}/like`, {
        method: "POST",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return alert(json?.error || "Failed to like");
      onChange?.();
    } finally {
      setLoading(false);
    }
  }

  function startEdit() {
    if (!myUserId) return needLogin();
    if (!isMinePost) return alert("Not allowed");

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
    if (originalPost) setText(originalPost.content || "");
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

    if (!myUserId) return needLogin();
    if (!isMinePost) return alert("Not allowed");

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

      const json = await res.json().catch(() => ({}));
      if (!res.ok) return alert(json?.error || "Failed to update post");

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

    if (!myUserId) return needLogin();

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
        body: JSON.stringify({ text: trimmed, imageUrl }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) return alert(json?.error || "Failed to add comment");

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
    if (!myUserId) return needLogin();

    const ok = confirm("Delete this comment?");
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${post._id}/comments/${commentId}`, {
        method: "DELETE",
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) return alert(json?.error || "Failed to delete comment");

      onChange?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitReply(commentId) {
    if (!myUserId) return needLogin();

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
            text: trimmed,
            imageUrl,
            replyToId: replyTo?.replyToId || null,
          }),
        }
      );

      const json = await res.json().catch(() => ({}));
      if (!res.ok) return alert(json?.error || "Failed to reply");

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
    if (!myUserId) return needLogin();

    const ok = confirm("Delete this reply?");
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/posts/${post._id}/comments/${commentId}/replies/${replyId}`,
        { method: "DELETE" }
      );

      const json = await res.json().catch(() => ({}));
      if (!res.ok) return alert(json?.error || "Failed to delete reply");

      onChange?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleCommentLike(commentId) {
    if (!myUserId) return needLogin();

    setLoading(true);
    try {
      const res = await fetch(
        `/api/posts/${post._id}/comments/${commentId}/like`,
        { method: "POST" }
      );

      const json = await res.json().catch(() => ({}));
      if (!res.ok) return alert(json?.error || "Failed to like comment");

      onChange?.();
    } finally {
      setLoading(false);
    }
  }

  async function toggleReplyLike(commentId, replyId) {
    if (!myUserId) return needLogin();

    setLoading(true);
    try {
      const res = await fetch(
        `/api/posts/${post._id}/comments/${commentId}/replies/${replyId}/like`,
        { method: "POST" }
      );

      const json = await res.json().catch(() => ({}));
      if (!res.ok) return alert(json?.error || "Failed to like reply");

      onChange?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <TopMeta>
        {game?.slug ? (
          <Link href={`/games/${game.slug}`}>
            Related to: {game.title || game.slug}
          </Link>
        ) : (
          <span>Related to: (unknown game)</span>
        )}
      </TopMeta>

      {/* ================= VIEW MODE ================= */}
      {!isEditing && (
        <>
          <SmallMuted>
            {post.createdAt ? new Date(post.createdAt).toLocaleString() : ""}
          </SmallMuted>

          <AuthorLine>
            <Link href={`/users/${post.authorId}`}>Author profile</Link>
          </AuthorLine>

          <Body>{post.content}</Body>

          {post.imageUrl && (
            <MediaImage src={post.imageUrl} alt="" width={800} height={450} />
          )}

          {post.videoUrl && <MediaVideo src={post.videoUrl} controls />}

          {/* POST ACTIONS */}
          <ActionsRow>
            {isMinePost && (
              <>
                <Button type="button" onClick={startEdit} disabled={loading}>
                  Edit
                </Button>

                <DangerButton type="button" onClick={del} disabled={loading}>
                  Delete
                </DangerButton>
              </>
            )}

            <PrimaryButton
              type="button"
              onClick={toggleLike}
              disabled={loading}
            >
              {likedByMe ? "Unlike" : "Like"} ({likesCount})
            </PrimaryButton>
          </ActionsRow>

          {/* COMMENT FORM */}
          <CommentBox>
            <CommentRow>
              <TextInput
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
              />
              <PrimaryButton
                type="button"
                onClick={submitComment}
                disabled={loading}
              >
                Send
              </PrimaryButton>
            </CommentRow>

            <FileRow>
              <FileInput
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setCommentImageFile(e.target.files?.[0] || null)
                }
              />
              {commentImageFile && (
                <Button
                  type="button"
                  onClick={() => setCommentImageFile(null)}
                  disabled={loading}
                >
                  Remove image
                </Button>
              )}
            </FileRow>
          </CommentBox>

          {/* COMMENTS LIST */}
          <CommentsWrap>
            <CommentsTitle>Comments</CommentsTitle>

            <CommentsGrid>
              {(post.comments || []).map((c) => {
                const isMineComment =
                  myUserId && String(c.authorId) === String(myUserId);

                const commentLikes = Array.isArray(c.likedBy)
                  ? c.likedBy.length
                  : 0;

                const commentLikedByMe =
                  myUserId &&
                  Array.isArray(c.likedBy) &&
                  c.likedBy.includes(String(myUserId));

                return (
                  <CommentCard key={c._id}>
                    <SmallMuted>
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleString()
                        : ""}
                    </SmallMuted>

                    <UserLinkRow>
                      <Link href={`/users/${c.authorId}`}>Author profile</Link>
                    </UserLinkRow>

                    <CommentText>{c.text}</CommentText>

                    {c.imageUrl && (
                      <MediaImage
                        src={c.imageUrl}
                        alt=""
                        width={600}
                        height={400}
                      />
                    )}

                    {/* COMMENT ACTIONS */}
                    <ActionsRowSmall>
                      <LinkButton
                        type="button"
                        onClick={() => {
                          setReplyOpenForId(
                            replyOpenForId === c._id ? null : c._id
                          );
                          setReplyText("");
                          setReplyImageFile(null);
                          setReplyTo({ commentId: c._id, replyToId: null });
                        }}
                        disabled={loading}
                      >
                        Reply
                      </LinkButton>

                      <LinkButton
                        type="button"
                        onClick={() => toggleCommentLike(c._id)}
                        disabled={loading}
                      >
                        {commentLikedByMe ? "Unlike" : "Like"} ({commentLikes})
                      </LinkButton>

                      {isMineComment && (
                        <LinkDanger
                          type="button"
                          onClick={() => deleteComment(c._id)}
                          disabled={loading}
                        >
                          Delete
                        </LinkDanger>
                      )}
                    </ActionsRowSmall>

                    {/* REPLIES LIST */}
                    {Array.isArray(c.replies) && c.replies.length > 0 && (
                      <RepliesWrap>
                        {c.replies.map((r) => {
                          const isMineReply =
                            myUserId && String(r.authorId) === String(myUserId);

                          const replyLikes = Array.isArray(r.likedBy)
                            ? r.likedBy.length
                            : 0;

                          const replyLikedByMe =
                            myUserId &&
                            Array.isArray(r.likedBy) &&
                            r.likedBy.includes(String(myUserId));

                          return (
                            <ReplyCard key={r._id}>
                              <SmallMuted>
                                {r.createdAt
                                  ? new Date(r.createdAt).toLocaleString()
                                  : ""}
                              </SmallMuted>

                              <UserLinkRow>
                                <Link href={`/users/${r.authorId}`}>
                                  Author profile
                                </Link>
                              </UserLinkRow>

                              {r.replyToId && (
                                <ReplyToLine>
                                  Reply to: {String(r.replyToId).slice(-6)}
                                </ReplyToLine>
                              )}

                              <CommentText>{r.text}</CommentText>

                              {r.imageUrl && (
                                <MediaImage
                                  src={r.imageUrl}
                                  alt=""
                                  width={600}
                                  height={400}
                                />
                              )}

                              {/* REPLY ACTIONS */}
                              <ActionsRowSmall>
                                <LinkButton
                                  type="button"
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
                                </LinkButton>

                                <LinkButton
                                  type="button"
                                  onClick={() => toggleReplyLike(c._id, r._id)}
                                  disabled={loading}
                                >
                                  {replyLikedByMe ? "Unlike" : "Like"} (
                                  {replyLikes})
                                </LinkButton>

                                {isMineReply && (
                                  <LinkDanger
                                    type="button"
                                    onClick={() => deleteReply(c._id, r._id)}
                                    disabled={loading}
                                  >
                                    Delete
                                  </LinkDanger>
                                )}
                              </ActionsRowSmall>
                            </ReplyCard>
                          );
                        })}
                      </RepliesWrap>
                    )}

                    {/* REPLY FORM (under comment) */}
                    {replyOpenForId === c._id && (
                      <ReplyForm>
                        <CommentRow>
                          <TextInput
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write a reply..."
                          />
                          <PrimaryButton
                            type="button"
                            onClick={() => submitReply(c._id)}
                            disabled={loading}
                          >
                            Send
                          </PrimaryButton>
                        </CommentRow>

                        <FileRow>
                          <FileInput
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              setReplyImageFile(e.target.files?.[0] || null)
                            }
                          />
                          {replyImageFile && (
                            <Button
                              type="button"
                              onClick={() => setReplyImageFile(null)}
                              disabled={loading}
                            >
                              Remove image
                            </Button>
                          )}
                        </FileRow>
                      </ReplyForm>
                    )}
                  </CommentCard>
                );
              })}

              {(post.comments || []).length === 0 && (
                <EmptyText>No comments yet</EmptyText>
              )}
            </CommentsGrid>
          </CommentsWrap>
        </>
      )}

      {/* ================= EDIT MODE ================= */}
      {isEditing && (
        <>
          <TextArea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          {/* CURRENT IMAGE */}
          {post.imageUrl && !removeImage && (
            <EditBlock>
              <SmallLabel>Current image</SmallLabel>
              <MediaImage src={post.imageUrl} alt="" width={800} height={450} />
              <Button
                type="button"
                onClick={() => setRemoveImage(true)}
                disabled={loading}
              >
                Remove image
              </Button>
            </EditBlock>
          )}

          <EditBlock>
            <SmallLabel>New image</SmallLabel>
            <FileInput
              type="file"
              accept="image/*"
              onChange={(e) => {
                setNewImageFile(e.target.files?.[0] || null);
                setRemoveImage(false);
              }}
            />
          </EditBlock>

          {/* CURRENT VIDEO */}
          {post.videoUrl && !removeVideo && (
            <EditBlock>
              <SmallLabel>Current video</SmallLabel>
              <MediaVideo src={post.videoUrl} controls />
              <Button
                type="button"
                onClick={() => setRemoveVideo(true)}
                disabled={loading}
              >
                Remove video
              </Button>
            </EditBlock>
          )}

          <EditBlock>
            <SmallLabel>New video</SmallLabel>
            <FileInput
              type="file"
              accept="video/*"
              onChange={(e) => {
                setNewVideoFile(e.target.files?.[0] || null);
                setRemoveVideo(false);
              }}
            />
          </EditBlock>

          {/* SAVE / CANCEL */}
          <ActionsRow>
            <PrimaryButton type="button" onClick={save} disabled={loading}>
              Save changes
            </PrimaryButton>

            <Button type="button" onClick={cancelEdit} disabled={loading}>
              Cancel
            </Button>
          </ActionsRow>
        </>
      )}
    </Card>
  );
}

/* ===================== styles ===================== */

const Card = styled.div`
  --color-bg: #ffffff;
  --color-surface: #ffffff;
  --color-text: #111827;
  --color-muted: #6b7280;
  --color-border: #e5e7eb;

  --color-primary: #4f46e5;
  --color-primary-hover: #4338ca;

  --color-danger: #dc2626;
  --color-danger-hover: #b91c1c;

  --font-sm: 12px;
  --font-md: 14px;

  --space-xs: 6px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-pill: 999px;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);

  border: 1px solid var(--color-border);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  color: var(--color-text);

  a {
    color: var(--color-primary);
    text-decoration: none;
    font-weight: 600;
  }

  a:hover {
    color: var(--color-primary-hover);
    text-decoration: underline;
  }

  @media (max-width: 520px) {
    padding: var(--space-sm);
  }
`;

const TopMeta = styled.div`
  font-size: var(--font-sm);
  color: var(--color-muted);
  opacity: 0.85;
  margin-bottom: var(--space-sm);
`;

const SmallMuted = styled.small`
  display: block;
  font-size: var(--font-sm);
  color: var(--color-muted);
  opacity: 0.85;
`;

const AuthorLine = styled.div`
  margin-top: var(--space-xs);
  font-size: var(--font-sm);
  opacity: 0.85;
`;

const Body = styled.p`
  margin: var(--space-sm) 0 0;
  font-size: var(--font-md);
  line-height: 1.5;
  word-break: break-word;
`;

const MediaImage = styled(Image)`
  width: 100%;
  height: auto;
  display: block;
  margin-top: var(--space-sm);
  border-radius: var(--radius-md);
  background: rgba(17, 24, 39, 0.04);
  max-height: 520px;
  object-fit: contain;
`;

const MediaVideo = styled.video`
  width: 100%;
  display: block;
  margin-top: var(--space-sm);
  border-radius: var(--radius-md);
`;

const ActionsRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: var(--space-md);
  flex-wrap: wrap;
`;

const ActionsRowSmall = styled.div`
  display: flex;
  gap: 10px;
  margin-top: var(--space-sm);
  flex-wrap: wrap;
`;

const BaseButton = styled.button`
  appearance: none;
  border: 1px solid var(--color-border);
  background: #fff;
  color: var(--color-text);
  font-weight: 700;
  font-size: var(--font-sm);
  padding: 7px 12px;
  border-radius: var(--radius-pill);
  cursor: pointer;
  white-space: nowrap;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Button = styled(BaseButton)`
  background: rgba(17, 24, 39, 0.02);

  &:hover:not(:disabled) {
    background: rgba(17, 24, 39, 0.05);
  }
`;

const PrimaryButton = styled(BaseButton)`
  border-color: rgba(79, 70, 229, 0.25);
  background: rgba(79, 70, 229, 0.1);
  color: var(--color-primary);

  &:hover:not(:disabled) {
    background: rgba(79, 70, 229, 0.14);
    border-color: rgba(79, 70, 229, 0.35);
  }
`;

const DangerButton = styled(BaseButton)`
  border-color: rgba(220, 38, 38, 0.25);
  background: rgba(220, 38, 38, 0.08);
  color: var(--color-danger);

  &:hover:not(:disabled) {
    background: rgba(220, 38, 38, 0.14);
    border-color: rgba(220, 38, 38, 0.35);
    color: var(--color-danger-hover);
  }
`;

const LinkButton = styled.button`
  appearance: none;
  border: none;
  background: transparent;
  padding: 0;
  font-size: var(--font-sm);
  color: var(--color-primary);
  font-weight: 700;
  cursor: pointer;

  &:hover:not(:disabled) {
    text-decoration: underline;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LinkDanger = styled(LinkButton)`
  color: var(--color-danger);
`;

const CommentBox = styled.div`
  display: grid;
  gap: var(--space-sm);
  margin-top: var(--space-md);
`;

const CommentRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;

  @media (max-width: 520px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const TextInput = styled.input`
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-md);

  &:focus {
    outline: none;
    border-color: rgba(79, 70, 229, 0.35);
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
  }
`;

const FileRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
`;

const FileInput = styled.input`
  font-size: var(--font-sm);
`;

const CommentsWrap = styled.div`
  margin-top: var(--space-lg);
`;

const CommentsTitle = styled.strong`
  display: block;
  font-size: 13px;
`;

const CommentsGrid = styled.div`
  display: grid;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
`;

const CommentCard = styled.div`
  padding: var(--space-sm);
  border: 1px solid rgba(229, 231, 235, 0.9);
  border-radius: var(--radius-sm);
  background: rgba(17, 24, 39, 0.01);
`;

const UserLinkRow = styled.div`
  margin-top: 4px;
  font-size: var(--font-sm);
`;

const CommentText = styled.div`
  margin-top: 6px;
  font-size: var(--font-md);
  line-height: 1.45;
  word-break: break-word;
`;

const RepliesWrap = styled.div`
  margin-top: var(--space-sm);
  margin-left: 16px;
  display: grid;
  gap: var(--space-sm);
`;

const ReplyCard = styled.div`
  padding: var(--space-sm);
  border: 1px solid rgba(240, 240, 240, 1);
  border-radius: var(--radius-sm);
  background: #fff;
`;

const ReplyToLine = styled.div`
  margin-top: 2px;
  font-size: var(--font-sm);
  color: var(--color-muted);
  opacity: 0.85;
`;

const ReplyForm = styled.div`
  margin-top: var(--space-md);
  margin-left: 16px;
  display: grid;
  gap: var(--space-sm);
`;

const EmptyText = styled.div`
  font-size: 13px;
  color: var(--color-muted);
  opacity: 0.85;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-md);
  resize: vertical;

  &:focus {
    outline: none;
    border-color: rgba(79, 70, 229, 0.35);
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
  }
`;

const EditBlock = styled.div`
  margin-top: var(--space-md);
  display: grid;
  gap: 6px;
`;

const SmallLabel = styled.div`
  font-size: var(--font-sm);
  color: var(--color-muted);
  opacity: 0.85;
`;
