import { useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";

const fetcher = (url) => fetch(url).then((r) => r.json());

function getClientId() {
  if (typeof window === "undefined") return null;

  let id = localStorage.getItem("clientId");

  if (!id) {
    // на всякий случай совместимее, чем randomUUID
    id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem("clientId", id);
  }

  return id;
}

const { data: session } = useSession();

//IMAGE AND VIDEO UPLOAD
// file -> base64 -> /api/upload -> url
async function uploadToCloudinary(file, kind) {
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result); // data:image/.  ...;base64,...
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file: base64, kind }), // kind: "image" | "video"
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Upload failed");
  return json.url;
}

export default function CreatePost({ onCreated }) {
  const { data: games, error: gamesError } = useSWR("/api/games", fetcher);

  const [gameId, setGameId] = useState("");
  const [content, setContent] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const [fileKey, setFileKey] = useState(0); // state for input reset

  async function submit(e) {
    e.preventDefault();
    setErr("");

    if (!myUserId) return setErr("Login required");

    const trimmed = content.trim();
    if (!gameId) return setErr("Pick a game");
    if (!trimmed) return setErr("Write something");

    const authorId = getClientId();
    if (!authorId) return setErr("No authorId (clientId) on this device");

    setLoading(true);
    try {
      // 1) upload media (optional)
      let imageUrl = "";
      let videoUrl = "";

      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile, "image");
      }

      if (videoFile) {
        videoUrl = await uploadToCloudinary(videoFile, "video");
      }
      // 2) create post with urls
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId,
          content: trimmed,
          authorId: myUserId,
          imageUrl,
          videoUrl,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setErr(json?.error || "Failed to create post");
        return;
      }

      setContent("");
      setGameId("");
      setImageFile(null);
      setVideoFile(null);
      setFileKey((k) => k + 1);
      onCreated?.();
    } catch (e2) {
      setErr(e2.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  }

  if (gamesError) return <p>Failed to load games</p>;
  if (!games) return <p>Loading...</p>;

  return (
    <form
      onSubmit={submit}
      style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}
    >
      <h3 style={{ marginTop: 0 }}>Create post</h3>

      <label style={{ display: "block", marginBottom: 8 }}>
        Game
        <select
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          style={{ display: "block", width: "100%", marginTop: 4 }}
        >
          <option value="">-- choose a game --</option>
          {games.map((g) => (
            <option key={g._id} value={g._id}>
              {g.title}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: "block", marginBottom: 8 }}>
        Text
        <textarea
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ display: "block", width: "100%", marginTop: 4 }}
          placeholder="Write something..."
        />
      </label>

      <label style={{ display: "block", marginBottom: 8 }}>
        Image (optional)
        <input
          key={`img-${fileKey}`}
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        />
        {imageFile && (
          <div
            style={{
              marginTop: 6,
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 12, opacity: 0.7 }}>{imageFile.name}</span>
            <button
              type="button"
              onClick={() => {
                setImageFile(null);
                setFileKey((k) => k + 1);
              }}
              style={{ fontSize: 12 }}
            >
              Remove
            </button>
          </div>
        )}
      </label>

      <label style={{ display: "block", marginBottom: 8 }}>
        Video (optional)
        <input
          key={`vid-${fileKey}`}
          type="file"
          accept="video/*"
          onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
        />
        {videoFile && (
          <div
            style={{
              marginTop: 6,
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 12, opacity: 0.7 }}>{videoFile.name}</span>
            <button
              type="button"
              onClick={() => {
                setVideoFile(null);
                setFileKey((k) => k + 1);
              }}
              style={{ fontSize: 12 }}
            >
              Remove
            </button>
          </div>
        )}
      </label>

      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <button type="submit" disabled={loading}>
        {loading ? "Posting..." : "Post"}
      </button>
    </form>
  );
}
