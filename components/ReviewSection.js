// components/ReviewSection.js
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import styled from "styled-components";
import { useSession } from "next-auth/react";
import Link from "next/link";

const EDIT_WINDOW_MS = 15 * 60 * 1000; // 15 минут

const fetcher = async (url) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Failed to load");
  return json;
};

export default function ReviewSection({ gameId }) {
  const { data: session } = useSession(); // хук для авторизации
  const myUserId = session?.user?.dbUserId || null; // user id

  // normalize ids (string/ObjectId/populated object)
  function normId(v) {
    if (!v) return null;
    if (typeof v === "object" && v._id) v = v._id;
    return v.toString();
  }

  const {
    data: reviews,
    error,
    isLoading,
    mutate,
  } = useSWR(gameId ? `/api/reviews?gameId=${gameId}` : null, fetcher);

  const [rating, setRating] = useState(10);
  const [text, setText] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [openUpdateForId, setOpenUpdateForId] = useState(null);
  const [updateText, setUpdateText] = useState("");
  const [updateError, setUpdateError] = useState("");

  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editRating, setEditRating] = useState(8);

  const [editingUpdateKey, setEditingUpdateKey] = useState(null); // `${reviewId}:${index}`
  const [editUpdateText, setEditUpdateText] = useState("");

  const [hasSpoilers, setHasSpoilers] = useState(false);

  // Update form
  const [updateHasSpoilers, setUpdateHasSpoilers] = useState(false);

  // edit review
  const [editHasSpoilers, setEditHasSpoilers] = useState(false);

  // edit update
  const [editUpdateHasSpoilers, setEditUpdateHasSpoilers] = useState(false);

  //---------------current time (seconds)------------//
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t); // Keeps current timestamp in state and updates it every second to trigger re-renders
  }, []);
  //--------------------------//

  //----------------mm:ss format // Formats milliseconds as minutes and seconds-------------//
  function formatMs(ms) {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const m = String(Math.floor(totalSec / 60)).padStart(2, "0");
    const s = String(totalSec % 60).padStart(2, "0");
    return `${m}:${s}`;
  }
  //-------------------------//
  // rating
  const stats = useMemo(() => {
    const list = reviews || [];
    const count = list.length;

    const avg =
      count === 0
        ? 0
        : list.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / count;

    return { count, avg: Number(avg.toFixed(1)) };
  }, [reviews]);

  function needLogin() {
    alert("Please sign in or log in, to write review, like and comment");
  }

  //----------------edit review (update review too)----------------//
  async function saveReviewEdit(review) {
    if (!myUserId) return needLogin();

    const res = await fetch(`/api/reviews/${review._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: editText,
        rating: editRating,
        hasSpoilers: editHasSpoilers,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      alert(json?.error || "Failed to edit review");
      return;
    }

    setEditingReviewId(null);
    await mutate();
  }

  async function saveUpdateEdit(reviewId, index) {
    if (!myUserId) return needLogin();

    const res = await fetch(`/api/reviews/${reviewId}/updates/${index}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // authorId больше не отправляем — сервер должен проверять по session
        text: editUpdateText,
        hasSpoilers: editUpdateHasSpoilers,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      alert(json?.error || "Failed to edit update");
      return;
    }

    setEditingUpdateKey(null);
    await mutate();
  }
  //-----------------------//

  //-----Delete review-----//
  async function handleDelete(reviewId) {
    if (!myUserId) return needLogin();

    const ok = confirm("Delete this review?");
    if (!ok) return;

    const resp = await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
    const result = await resp.json();

    if (!resp.ok) {
      alert(result?.error || "Failed to delete review");
      return;
    }

    await mutate();
  }

  //-----Submit Update Review-----//
  async function submitUpdate(reviewId) {
    if (!myUserId) return needLogin();

    setUpdateError("");

    try {
      const res = await fetch(`/api/reviews/${reviewId}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: updateText,
          hasSpoilers: updateHasSpoilers,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setUpdateError(json?.error || "Failed to add update");
        return;
      }

      setUpdateText("");
      setUpdateHasSpoilers(false);
      setOpenUpdateForId(null);
      await mutate();
    } catch (err) {
      setUpdateError(err.message || "Failed to add update");
    }
  }

  //-----Delete updated Review-----//
  async function handleDeleteUpdate(reviewId, updateIndex) {
    if (!myUserId) return needLogin();

    const ok = confirm("Delete this update?");
    if (!ok) return;

    try {
      const res = await fetch(
        `/api/reviews/${reviewId}/updates/${updateIndex}`,
        { method: "DELETE" }
      );

      const json = await res.json();

      if (!res.ok) {
        alert(json?.error || "Failed to delete update");
        return;
      }

      await mutate();
    } catch (err) {
      alert(err.message || "Failed to delete update");
    }
  }

  //------Vote Functions------//
  async function voteReview(reviewId, type) {
    if (!myUserId) return needLogin();

    await fetch(`/api/reviews/${reviewId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    await mutate();
  }

  async function voteUpdate(reviewId, updateIndex, type) {
    if (!myUserId) return needLogin();

    await fetch(`/api/reviews/${reviewId}/updates/${updateIndex}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    await mutate();
  }

  //------Submit Review--------//
  async function handleSubmit(e) {
    e.preventDefault();
    if (!myUserId) return needLogin();

    setSubmitError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId,
          rating,
          text,
          hasSpoilers,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setSubmitError(json?.error || "Failed to submit review");
        return;
      }

      setText("");
      setRating(8);
      setHasSpoilers(false);

      await mutate();
    } catch (err) {
      setSubmitError(err.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  }

  //---------------RETURN------------//
  return (
    <Wrap>
      <Header>
        <h2>Reviews</h2>
        <Stats>
          <strong>{stats.avg}</strong> / 10 • {stats.count} review(s)
        </Stats>
      </Header>

      <Form onSubmit={handleSubmit}>
        <Row>
          <label>
            Rating (1–10)
            <input
              type="number"
              min="1"
              max="10"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            />
          </label>
        </Row>

        <Row>
          <label>
            Text
            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write your review..."
            />
          </label>
        </Row>

        {/* SPOILERS */}
        <Row>
          <label>
            <input
              type="checkbox"
              checked={hasSpoilers}
              onChange={(e) => setHasSpoilers(e.target.checked)}
            />{" "}
            This review contains spoilers
          </label>
          <Hint>
            Please tick this if your review reveals story details, so others can
            decide whether to read it.
          </Hint>
        </Row>

        {submitError && <ErrorText>{submitError}</ErrorText>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Submit review"}
        </button>
      </Form>

      <List>
      {isLoading && (
        <InlineState>
          <InlineTitle>Loading…</InlineTitle>
          <InlineText>Reviews are loading</InlineText>
        </InlineState>
      )}

      {error && (
        <InlineState>
          <InlineTitle>Error</InlineTitle>
          <InlineText>Failed to load reviews</InlineText>
        </InlineState>
      )}

      {!isLoading && !error && reviews?.length === 0 && (
        <InlineState>
          <InlineTitle>No reviews yet</InlineTitle>
          <InlineText>Be the first to write a review</InlineText>
        </InlineState>
      )}

        {(reviews || []).map((r) => {
          const reviewAge = now - new Date(r.createdAt).getTime();
          const reviewLeft = EDIT_WINDOW_MS - reviewAge;

          // owner check (string-safe)
          const isOwnerReview =
            myUserId && normId(r.authorId) === normId(myUserId);

          const canEditReview = isOwnerReview && reviewLeft > 0;

          return (
            <Card key={r._id}>
              <Top>
                <AuthorLine>
                  <Link href={`/users/${normId(r.authorId)}`}>
                    Author profile
                  </Link>
                </AuthorLine>
                <span>Rating: {r.rating}/10</span>
                <small>{new Date(r.createdAt).toLocaleDateString()}</small>
                {r.hasSpoilers && <SpoilerTag>⚠️ Spoilers</SpoilerTag>}
              </Top>

              {canEditReview && (
                <p style={{ opacity: 0.7 }}>
                  You can edit for: {formatMs(reviewLeft)}
                </p>
              )}

              {canEditReview && editingReviewId !== r._id && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingReviewId(r._id);
                    setEditText(r.text);
                    setEditRating(r.rating);
                    setEditHasSpoilers(Boolean(r.hasSpoilers));
                  }}
                >
                  Edit review
                </button>
              )}

              {canEditReview && editingReviewId === r._id && (
                <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editRating}
                    onChange={(e) => setEditRating(e.target.value)}
                  />
                  <textarea
                    rows={4}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                  />

                  <label>
                    <input
                      type="checkbox"
                      checked={editHasSpoilers}
                      onChange={(e) => setEditHasSpoilers(e.target.checked)}
                    />{" "}
                    This review contains spoilers
                  </label>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" onClick={() => saveReviewEdit(r)}>
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingReviewId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {editingReviewId !== r._id && <p>{r.text}</p>}

              {/* VOTE BUTTONS */}
              <VotesRow>
                <button
                  type="button"
                  onClick={() => voteReview(r._id, "helpful")}
                >
                  Helpful {r.helpfulCount || 0}
                </button>
                <button
                  type="button"
                  onClick={() => voteReview(r._id, "notHelpful")}
                >
                  Not helpful {r.notHelpfulCount || 0}
                </button>
              </VotesRow>

              {/* DELETE only for owner */}
              {isOwnerReview && (
                <button type="button" onClick={() => handleDelete(r._id)}>
                  Delete
                </button>
              )}

              {/* SHOW UPDATES */}
              {Array.isArray(r.updates) && r.updates.length > 0 && (
                <Updates>
                  <strong>Updates:</strong>

                  {r.updates.map((u, i) => {
                    const key = `${r._id}:${i}`;

                    const updateAge = now - new Date(u.createdAt).getTime();
                    const updateLeft = EDIT_WINDOW_MS - updateAge;

                    // owner check for update
                    const isOwnerUpdate =
                      myUserId && normId(u.authorId) === normId(myUserId);

                    const canEditUpdate = isOwnerUpdate && updateLeft > 0;

                    return (
                      <UpdateItem key={u.createdAt + i}>
                        <small>
                          <AuthorLine>
                            <Link href={`/users/${normId(u.authorId)}`}>
                              Author profile
                            </Link>
                          </AuthorLine>
                          {new Date(u.createdAt).toLocaleDateString()}
                          {u.hasSpoilers && (
                            <SpoilerTag>⚠️ Spoilers</SpoilerTag>
                          )}
                        </small>

                        {editingUpdateKey !== key && <p>{u.text}</p>}

                        {canEditUpdate && (
                          <p style={{ opacity: 0.7 }}>
                            You can edit for: {formatMs(updateLeft)}
                          </p>
                        )}

                        {canEditUpdate && editingUpdateKey !== key && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUpdateKey(key);
                              setEditUpdateText(u.text);
                              setEditUpdateHasSpoilers(Boolean(u.hasSpoilers));
                            }}
                          >
                            Edit update
                          </button>
                        )}

                        {canEditUpdate && editingUpdateKey === key && (
                          <div
                            style={{ display: "grid", gap: 8, marginTop: 6 }}
                          >
                            <textarea
                              rows={3}
                              value={editUpdateText}
                              onChange={(e) =>
                                setEditUpdateText(e.target.value)
                              }
                            />
                            <label>
                              <input
                                type="checkbox"
                                checked={editUpdateHasSpoilers}
                                onChange={(e) =>
                                  setEditUpdateHasSpoilers(e.target.checked)
                                }
                              />{" "}
                              This update contains spoilers
                            </label>

                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                type="button"
                                onClick={() => saveUpdateEdit(r._id, i)}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingUpdateKey(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* VOTE BUTTONS FOR UPDATE REVIEWS*/}
                        <VotesRow>
                          <button
                            type="button"
                            onClick={() => voteUpdate(r._id, i, "helpful")}
                          >
                            Helpful {u.helpfulCount || 0}
                          </button>
                          <button
                            type="button"
                            onClick={() => voteUpdate(r._id, i, "notHelpful")}
                          >
                            Not helpful {u.notHelpfulCount || 0}
                          </button>
                        </VotesRow>

                        {/* DELETE update only for owner */}
                        {isOwnerUpdate && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUpdate(r._id, i)}
                          >
                            Delete update
                          </button>
                        )}
                      </UpdateItem>
                    );
                  })}
                </Updates>
              )}

              {/* add update only for owner and logged in */}
              {isOwnerReview && (
                <button
                  type="button"
                  onClick={() => {
                    if (!myUserId) return needLogin();
                    setUpdateError("");
                    setUpdateText("");
                    setOpenUpdateForId(
                      openUpdateForId === r._id ? null : r._id
                    );
                  }}
                >
                  Add update
                </button>
              )}

              {openUpdateForId === r._id && (
                <UpdateForm>
                  <textarea
                    rows={3}
                    value={updateText}
                    onChange={(e) => setUpdateText(e.target.value)}
                    placeholder="Write update..."
                  />

                  <label>
                    <input
                      type="checkbox"
                      checked={updateHasSpoilers}
                      onChange={(e) => setUpdateHasSpoilers(e.target.checked)}
                    />{" "}
                    This update contains spoilers
                  </label>

                  {updateError && <ErrorText>{updateError}</ErrorText>}

                  <button type="button" onClick={() => submitUpdate(r._id)}>
                    Save update
                  </button>
                </UpdateForm>
              )}
            </Card>
          );
        })}
      </List>
    </Wrap>
  );
}

const Wrap = styled.section`
  --color-bg: #ffffff;
  --color-surface: #ffffff;
  --color-text: #111827;
  --color-muted: #6b7280;
  --color-border: #e5e7eb;
  --color-border-strong: #d1d5db;

  --color-primary: #4f46e5;
  --color-primary-hover: #4338ca;

  --color-danger: #dc2626;
  --color-danger-hover: #b91c1c;

  --color-warning: #f2b705;

  --font-sm: 12px;
  --font-md: 14px;
  --font-lg: 18px;

  --space-2xs: 4px;
  --space-xs: 6px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 24px;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-pill: 999px;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);

  margin-top: var(--space-xl);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--color-border);
  color: var(--color-text);

  h2 {
    margin: 0;
    font-size: var(--font-lg);
    line-height: 1.2;
  }

  p {
    margin: var(--space-xs) 0;
    font-size: var(--font-md);
    line-height: 1.4;
  }

  @media (min-width: 768px) {
    margin-top: 28px;
    padding-top: 18px;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-md);

  @media (min-width: 768px) {
    gap: var(--space-lg);
  }
`;

const Stats = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;

  border-radius: 999px;
  background: linear-gradient(135deg, #4f46e5, #4338ca);
  color: #fff;

  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;

  strong {
    font-size: 18px;
    font-weight: 800;
    line-height: 1;
  }

  @media (max-width: 480px) {
    padding: 6px 12px;
    font-size: 13px;

    strong {
      font-size: 16px;
    }
  }
`;

const Form = styled.form`
  margin-top: var(--space-md);
  padding: var(--space-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);

  button {
    appearance: none;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    padding: 10px 12px;
    background: var(--color-primary);
    color: #fff;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s ease, opacity 0.15s ease;
  }

  button:hover {
    background: var(--color-primary-hover);
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Row = styled.div`
  margin-bottom: var(--space-md);

  label {
    display: grid;
    gap: var(--space-xs);
    font-size: var(--font-md);
  }

  input,
  textarea {
    padding: 10px 12px;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    font-size: var(--font-md);
    background: var(--color-bg);
    color: var(--color-text);
    outline: none;
  }

  textarea {
    resize: vertical;
    min-height: 96px;
  }

  input:focus,
  textarea:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
  }

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    vertical-align: middle;
  }
`;

const ErrorText = styled.p`
  margin: var(--space-sm) 0;
  color: var(--color-danger);
  font-size: var(--font-md);
`;

const List = styled.div`
  margin-top: var(--space-lg);
  display: grid;
  gap: var(--space-lg);

  grid-template-columns: 1fr;

  justify-items: center;

  /* 2 columns like Metacritic */
  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
    align-items: start;

    justify-items: stretch;
  }
`;

const Card = styled.article`
  padding: var(--space-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);

  /* makes cards look more "grid-friendly" */
  height: 100%;

  small {
    color: var(--color-muted);
  }

  /* edit panels (inline "display: grid") */
  div[style*="display: grid"] {
    padding: var(--space-md);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg);
  }

  input,
  textarea {
    padding: 10px 12px;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    font-size: var(--font-md);
    background: var(--color-bg);
    color: var(--color-text);
    outline: none;
  }

  textarea {
    resize: vertical;
  }

  input:focus,
  textarea:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
  }

  /* default buttons in card */
  button {
    appearance: none;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    padding: 9px 12px;
    background: var(--color-bg);
    color: var(--color-text);
    font-weight: 600;
    cursor: pointer;
    transition: border-color 0.15s ease, transform 0.05s ease;
  }

  button:hover {
    border-color: var(--color-primary);
  }

  button:active {
    transform: translateY(1px);
  }

  /* bigger spacing between "free-standing" buttons (delete/ add update, etc) */
  & > button {
    margin-top: var(--space-md);
    display: inline-flex;
    align-items: center;
  }

  & > button + button {
    margin-left: var(--space-md);
  }
`;

const Top = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);

  span {
    font-weight: 700;
  }

  small {
    font-size: var(--font-sm);
  }
`;

const Updates = styled.div`
  margin-top: var(--space-md);
  padding: var(--space-md);
  border-left: 3px solid var(--color-border-strong);
  background: rgba(17, 24, 39, 0.02);
  border-radius: var(--radius-sm);

  strong {
    display: block;
    margin-bottom: var(--space-sm);
  }
`;

const UpdateItem = styled.div`
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1px dashed var(--color-border);

  small {
    display: block;
    opacity: 0.9;
    margin-bottom: var(--space-xs);
    font-size: var(--font-sm);
  }

  p {
    margin: var(--space-xs) 0;
  }

  button {
    margin-top: var(--space-xs);
    font-size: var(--font-sm);
    background: none;
    border: none;
    color: var(--color-danger);
    cursor: pointer;
    padding: 0;
    font-weight: 600;
  }

  button:hover {
    color: var(--color-danger-hover);
    text-decoration: underline;
  }
`;

const UpdateForm = styled.form`
  margin-top: var(--space-md);
  display: grid;
  gap: var(--space-sm);
  padding: var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);

  textarea {
    padding: 10px 12px;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    font-size: var(--font-md);
  }

  button {
    width: fit-content;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    padding: 9px 12px;
    background: var(--color-primary);
    color: #fff;
    font-weight: 700;
    cursor: pointer;
  }

  button:hover {
    background: var(--color-primary-hover);
  }

  label {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    font-size: var(--font-md);
  }
`;

const VotesRow = styled.div`
  margin-top: var(--space-md);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);

  button {
    padding: 9px 12px;
    border: 1px solid var(--color-border-strong);
    background: var(--color-bg);
    cursor: pointer;
    border-radius: var(--radius-sm);
    font-weight: 600;
  }

  button:hover {
    border-color: var(--color-primary);
  }
`;

const SpoilerTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  margin-left: var(--space-sm);
  padding: 2px 10px;
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-pill);
  font-size: var(--font-sm);
  background: rgba(242, 183, 5, 0.12);
`;

const Hint = styled.p`
  margin: var(--space-xs) 0 0;
  font-size: var(--font-sm);
  color: var(--color-muted);
`;

const AuthorLine = styled.div`
  margin: 6px 0 8px;
  font-size: 13px;

  a {
    color: #4642d0ff;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
`;

const InlineState = styled.div`
  margin: 32px auto 0; 
  padding: 28px 20px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(17, 24, 39, 0.02);
  text-align: center;

  width: 100%;
  max-width: 520px;
`;

const InlineTitle = styled.div`
  font-weight: 800;
  font-size: var(--font-md);
  color: var(--color-text);
`;

const InlineText = styled.div`
  margin-top: 6px;
  font-size: var(--font-sm);
  color: var(--color-muted);
`;

