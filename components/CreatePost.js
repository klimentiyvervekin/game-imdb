import { useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";

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
  const { data: session } = useSession();
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

    // ❗️ если не залогинен — не даём отправить
    if (!session?.user?.dbUserId) {
      return setErr(
        "Пожалуйста, зарегистрируйтесь или войдите, чтобы писать посты"
      );
    }

    if (!gameId) return setErr("Pick a game");
    if (!content.trim()) return setErr("Write something");

    setLoading(true);
    try {
      let imageUrl = "";
      let videoUrl = "";

      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile, "image");
      }

      if (videoFile) {
        videoUrl = await uploadToCloudinary(videoFile, "video");
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId,
          content: content.trim(),
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
    } catch (e) {
      setErr(e.message || "Failed to create post");
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
      </label>

      <label style={{ display: "block", marginBottom: 8 }}>
        Video (optional)
        <input
          key={`vid-${fileKey}`}
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
