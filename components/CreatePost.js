import { useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import styled from "styled-components";

const fetcher = (url) => fetch(url).then((r) => r.json());

// IMAGE / VIDEO UPLOAD
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

export default function CreatePost({ onCreated }) {
  const { data: session, status } = useSession();
  const { data: games, error: gamesError } = useSWR("/api/games", fetcher);

  const [gameId, setGameId] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileKey, setFileKey] = useState(0);

  async function submit(e) {
    e.preventDefault();
    setErr("");

    if (status === "loading") return;

    if (!session?.user?.dbUserId) {
      return setErr("Please log in or sign in to write posts.");
    }

    const trimmed = content.trim();
    if (!gameId) return setErr("Pick a game");
    if (!trimmed) return setErr("Write something");

    setLoading(true);
    try {
      let imageUrl = "";
      let videoUrl = "";

      if (imageFile) imageUrl = await uploadToCloudinary(imageFile, "image");
      if (videoFile) videoUrl = await uploadToCloudinary(videoFile, "video");

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId,
          content: trimmed,
          imageUrl,
          videoUrl,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setErr(json?.error || "Failed to create post");
        return;
      }

      // reset form
      setContent("");
      setGameId("");
      setImageFile(null);
      setVideoFile(null);
      setFileKey((k) => k + 1);

      onCreated?.();
    } catch (e2) {
      setErr(e2?.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  }

  if (gamesError) return <p>Failed to load games</p>;
  if (!games) return <p>Loading...</p>;

  return (
    <Form onSubmit={submit}>
      <Title>Create post</Title>

      <Field>
        Game
        <Select value={gameId} onChange={(e) => setGameId(e.target.value)}>
          <option value="">-- choose a game --</option>
          {games.map((g) => (
            <option key={g._id} value={g._id}>
              {g.title}
            </option>
          ))}
        </Select>
      </Field>

      <Field>
        Text
        <Textarea
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write something..."
        />
      </Field>

      {/* uploads row: 2 columns on desktop,1 column on mobile */}
      <UploadRow>
        <UploadBox>
          <UploadTitle>Image (optional)</UploadTitle>
          <FileInput
            key={`img-${fileKey}`}
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />
        </UploadBox>

        <UploadBox>
          <UploadTitle>Video (optional)</UploadTitle>
          <FileInput
            key={`vid-${fileKey}`}
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
          />
        </UploadBox>
      </UploadRow>

      {err && <ErrorText>{err}</ErrorText>}

      <SubmitButton type="submit" disabled={loading || status === "loading"}>
        {loading ? "Posting..." : "Post"}
      </SubmitButton>
    </Form>
  );
}

/* ===================== styles ===================== */

const Form = styled.form`
  --color-bg: #ffffff;
  --color-surface: #ffffff;
  --color-text: #111827;
  --color-muted: #6b7280;
  --color-border: #e5e7eb;
  --color-border-strong: #d1d5db;

  --color-primary: #4f46e5;
  --color-primary-hover: #4338ca;

  --color-danger: #dc2626;

  --font-sm: 12px;
  --font-md: 14px;
  --font-lg: 16px;

  --space-xs: 6px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-pill: 999px;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);

  border: 1px solid var(--color-border);
  padding: var(--space-lg);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  color: var(--color-text);
`;

const Title = styled.h3`
  margin-top: 0;
  margin-bottom: var(--space-md);
  font-size: var(--font-lg);
`;

const Field = styled.label`
  display: block;
  margin-bottom: var(--space-md);
  font-size: var(--font-md);
  color: var(--color-text);
`;

const UploadRow = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-md);
  margin-bottom: var(--space-md);

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
`;

const UploadBox = styled.div`
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  background: rgba(17, 24, 39, 0.02);
`;

const UploadTitle = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: var(--color-muted);
  margin-bottom: 6px;
`;

const Select = styled.select`
  display: block;
  width: 100%;
  margin-top: var(--space-xs);

  padding: 10px 12px;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  font-size: var(--font-md);
  background: var(--color-bg);
  color: var(--color-text);
  outline: none;

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
  }
`;

const Textarea = styled.textarea`
  display: block;
  width: 100%;
  margin-top: var(--space-xs);

  padding: 10px 12px;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  font-size: var(--font-md);
  background: var(--color-bg);
  color: var(--color-text);
  outline: none;
  resize: vertical;
  min-height: 92px;

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
  }
`;

const FileInput = styled.input`
  width: 100%;
  font-size: 13px;
  color: var(--color-muted);

  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  background: #fff;

  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;

  &:hover {
    background: rgba(79, 70, 229, 0.04);
    border-color: rgba(79, 70, 229, 0.35);
  }

  &:focus {
    outline: none;
    border-color: rgba(79, 70, 229, 0.5);
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
  }

  &::file-selector-button {
    appearance: none;
    border: 1px solid rgba(79, 70, 229, 0.25);
    background: rgba(79, 70, 229, 0.12);
    color: var(--color-primary);
    font-weight: 800;
    font-size: 13px;
    padding: 7px 14px;
    border-radius: var(--radius-pill);
    margin-right: 10px;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;
  }

  &::file-selector-button:hover {
    background: rgba(79, 70, 229, 0.18);
    border-color: rgba(79, 70, 229, 0.35);
  }

  /* safari */
  &::-webkit-file-upload-button {
    appearance: none;
    border: 1px solid rgba(79, 70, 229, 0.25);
    background: rgba(79, 70, 229, 0.12);
    color: var(--color-primary);
    font-weight: 800;
    font-size: 13px;
    padding: 7px 14px;
    border-radius: var(--radius-pill);
    margin-right: 10px;
    cursor: pointer;
  }
`;

const ErrorText = styled.p`
  margin: 0 0 var(--space-md);
  color: var(--color-danger);
  font-size: var(--font-md);
`;

const SubmitButton = styled.button`
  appearance: none;
  border: 1px solid transparent;
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
  font-size: var(--font-md);
  padding: 10px 14px;
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: background 0.15s ease, opacity 0.15s ease;

  &:hover {
    background: var(--color-primary-hover);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
