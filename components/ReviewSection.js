import { useMemo, useState } from "react";
import useSWR from "swr";
import styled from "styled-components";

const fetcher = async (url) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Failed to load");
  return json;
};

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

  //-----Delete-----//
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

  //-----Update Review-----//
  async function submitUpdate(reviewId) {
    setUpdateError("");

    try {
      const res = await fetch(`/api/reviews/${reviewId}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: updateText }),
      });

      const json = await res.json();

      if (!res.ok) {
        setUpdateError(json?.error || "Failed to add update");
        return;
      }

      setUpdateText("");
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

    await mutate();

  } catch (err) {
    alert(err.message || "Failed to delete update");
  }
}

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, rating, text }),
      });

      const json = await res.json();

      if (!res.ok) {
        setSubmitError(json?.error || "Failed to submit review");
        return;
      }

      setText("");
      setRating(8);

      await mutate();
    } catch (err) {
      setSubmitError(err.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  }

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

        {submitError && <ErrorText>{submitError}</ErrorText>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Submit review"}
        </button>
      </Form>

      <List>
        {isLoading && <p>Loading...</p>}
        {error && <p>Failed to load data</p>}
        {!isLoading && !error && reviews?.length === 0 && <p>No reviews yet</p>}

        {(reviews || []).map((r) => (
          <Card key={r._id}>
            <Top>
              <span>Rating: {r.rating}/10</span>
              <small>{new Date(r.createdAt).toLocaleDateString()}</small>
            </Top>
            <p>{r.text}</p>

            {/* DELETE */}
            <button type="button" onClick={() => handleDelete(r._id)}>
              Delete
            </button>

            {/* SHOW UPDATES */}
            {Array.isArray(r.updates) && r.updates.length > 0 && (
              <Updates>
                <strong>Updates:</strong>

                {r.updates.map((u, i) => (
                  <UpdateItem key={u.createdAt + i}>
                    <small>{new Date(u.createdAt).toLocaleDateString()}</small>
                    <p>{u.text}</p>

                    <button
                      type="button"
                      onClick={() => handleDeleteUpdate(r._id, i)}
                    >
                      Delete update
                    </button>
                  </UpdateItem>
                ))}

              </Updates>
            )}

            {/* "OPEN FORM" BUTTON */}
            <button
              type="button"
              onClick={() => {
                setUpdateError("");
                setUpdateText("");
                setOpenUpdateForId(openUpdateForId === r._id ? null : r._id);
              }}
            >
              Add update
            </button>

            {openUpdateForId === r._id && (
              <UpdateForm
                onSubmit={(e) => {
                  e.preventDefault();
                  submitUpdate(r._id);
                }}
              >
                <textarea
                  rows={3}
                  value={updateText}
                  onChange={(e) => setUpdateText(e.target.value)}
                  placeholder="Write update..."
                />

                {updateError && <ErrorText>{updateError}</ErrorText>}

                <button type="submit">Save update</button>
              </UpdateForm>
            )}
          </Card>
        ))}
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

