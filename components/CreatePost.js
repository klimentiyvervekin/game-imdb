import { useState } from "react";
import useSWR from "swr";

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

//IMAGE AND VIDEO UPLOAD
// file -> base64 -> /api/upload -> url
async function uploadToCloudinary(file, kind) {
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result); // data:image/...;base64,...
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

  async function submit(e) {
    e.preventDefault();
    setErr("");

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
          authorId,
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
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        />
      </label>

      <label style={{ display: "block", marginBottom: 8 }}>
        Video (optional)
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
        />
      </label>

      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <button type="submit" disabled={loading}>
        {loading ? "Posting..." : "Post"}
      </button>
    </form>
  );
}
