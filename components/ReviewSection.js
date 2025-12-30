import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import styled from "styled-components";

const EDIT_WINDOW_MS = 15 * 60 * 1000;

const fetcher = async (url) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Failed to load");
  return json;
};

//---------helper--------//
function getClientId() {
  if (typeof window === "undefined") return "server";
  const key = "clientId";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    localStorage.setItem(key, id);
  }
  return id;
}
//----------------------//

export default function ReviewSection({ gameId }) {
  const {
    data: reviews,
    error,
    isLoading,
    mutate,
  } = useSWR(gameId ? `/api/reviews?gameId=${gameId}` : null, fetcher);

  const [rating, setRating] = useState(8);
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
  const clientId = useMemo(() => getClientId(), []);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  //--------------------------//

  //----------------mm:ss format-------------//
  function formatMs(ms) {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const m = String(Math.floor(totalSec / 60)).padStart(2, "0");
    const s = String(totalSec % 60).padStart(2, "0");
    return `${m}:${s}`;
  }
  //-------------------------//

  // "const stats = useMemo" means "count stats but only if reviews changed" (because of useMemo)
  // "toFixed" do "9,33333" to "9,3"
  const stats = useMemo(() => {
    const list = reviews || [];
    const count = list.length;

    // avg means here "middle score of all scores"
    const avg =
      count === 0
        ? 0
        : list.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / count;
    return { count, avg: Number(avg.toFixed(1)) };
  }, [reviews]);
  // if score 0 then 0, if not then summarise all scores to become a middle score of a game
  // reviews at the end means "only if reviews changed count a new average score"

  //----------------edit review (update review too)----------------//
  async function saveReviewEdit(review) {
    const res = await fetch(`/api/reviews/${review._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authorId: clientId,
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
    const res = await fetch(`/api/reviews/${reviewId}/updates/${index}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authorId: clientId,
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
    setUpdateError("");

    try {
      const res = await fetch(`/api/reviews/${reviewId}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: updateText,
          authorId: clientId,
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

      await mutate(); // update ui
    } catch (err) {
      alert(err.message || "Failed to delete update");
    }
  }

  //------Vote Functions------//
  async function voteReview(reviewId, type) {
    await fetch(`/api/reviews/${reviewId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, voterId: clientId }),
    });
    await mutate();
  }

  async function voteUpdate(reviewId, updateIndex, type) {
    await fetch(`/api/reviews/${reviewId}/updates/${updateIndex}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, voterId: clientId }),
    });
    await mutate();
  }

  //------Submit Review--------//
  async function handleSubmit(e) {
    e.preventDefault();
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
          authorId: clientId,
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
        {isLoading && <p>Loading...</p>}
        {error && <p>Failed to load data</p>}
        {!isLoading && !error && reviews?.length === 0 && <p>No reviews yet</p>}

        {(reviews || []).map((r) => {
          const reviewAge = now - new Date(r.createdAt).getTime();
          const reviewLeft = EDIT_WINDOW_MS - reviewAge;

          const canEditReview = r.authorId === clientId && reviewLeft > 0;

          return (
            <Card key={r._id}>
              <Top>
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

                  {/* edit spoilers checkbox */}
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

              {/* DELETE */}
              <button type="button" onClick={() => handleDelete(r._id)}>
                Delete
              </button>

              {/* SHOW UPDATES */}
              {Array.isArray(r.updates) && r.updates.length > 0 && (
                <Updates>
                  <strong>Updates:</strong>

                  {r.updates.map((u, i) => {
                    const key = `${r._id}:${i}`;

                    const updateAge = now - new Date(u.createdAt).getTime();
                    const updateLeft = EDIT_WINDOW_MS - updateAge;
                    const canEditUpdate =
                      u.authorId === clientId && updateLeft > 0;

                    return (
                      <UpdateItem key={u.createdAt + i}>
                        <small>
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

                              {/* edit spoilers update checkbox */}
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

                        {/* DELETE UPDATE REVIEW BUTTON */}
                        <button
                          type="button"
                          onClick={() => handleDeleteUpdate(r._id, i)}
                        >
                          Delete update
                        </button>
                      </UpdateItem>
                    );
                  })}
                </Updates>
              )}

              {/* "OPEN FORM" BUTTON */}
              <button
                type="button"
                onClick={() => {
                  setUpdateError("");
                  setUpdateText("");
                  setOpenUpdateForId(openUpdateForId === r._id ? null : r._id); // toggle logic for form
                }}
              >
                Add update
              </button>

              {openUpdateForId === r._id && (
                <UpdateForm>
                  <textarea
                    rows={3}
                    value={updateText}
                    onChange={(e) => setUpdateText(e.target.value)}
                    placeholder="Write update..."
                  />
                  {/* add update spoilers */}
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
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #eee;
`;

const Header = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
`;

const Stats = styled.div`
  opacity: 0.8;
`;

const Form = styled.form`
  margin-top: 12px;
  padding: 12px;
  border: 1px solid #eee;
`;

const Row = styled.div`
  margin-bottom: 10px;

  label {
    display: grid;
    gap: 6px;
  }

  input,
  textarea {
    padding: 8px;
    border: 1px solid #ddd;
  }
`;

const ErrorText = styled.p`
  margin: 8px 0;
  color: red;
`;

const List = styled.div`
  margin-top: 16px;
  display: grid;
  gap: 12px;
`;

const Card = styled.article`
  padding: 12px;
  border: 1px solid #eee;
`;

const Top = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
`;

const Updates = styled.div`
  margin-top: 10px;
  padding: 10px;
  border-left: 3px solid #ddd;

  strong {
    display: block;
    margin-bottom: 6px;
  }
`;

const UpdateItem = styled.div`
  margin-top: 8px;

  small {
    display: block;
    opacity: 0.7;
    margin-bottom: 4px;
  }

  p {
    margin: 4px 0;
  }

  button {
    margin-top: 4px;
    font-size: 12px;
    background: none;
    border: none;
    color: red;
    cursor: pointer;
  }
`;

const UpdateForm = styled.form`
  margin-top: 10px;
  display: grid;
  gap: 8px;

  textarea {
    padding: 8px;
    border: 1px solid #ddd;
  }

  button {
    width: fit-content;
  }
`;

const VotesRow = styled.div`
  margin-top: 8px;
  display: flex;
  gap: 10px;

  button {
    padding: 6px 10px;
    border: 1px solid #ddd;
    background: #fff;
    cursor: pointer;
  }
`;

const SpoilerTag = styled.span`
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  border: 1px solid #f2b705;
  border-radius: 999px;
  font-size: 12px;
`;
const Hint = styled.p`
  margin: 6px 0 0;
  font-size: 12px;
  opacity: 0.75;
`;
