import { useState, useMemo } from "react";
import useSWR from "swr";
import PostList from "./PostList";

const fetcher = (url) => fetch(url).then(r => r.json());

function getClientId() {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem("clientId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("clientId", id);
  }
  return id;
}

export default function PostSection({ gameId }) {
  const clientId = useMemo(getClientId, []);
  const { data: posts, mutate } = useSWR(
    gameId ? `/api/posts?gameId=${gameId}` : null,
    fetcher
  );

  const [text, setText] = useState("");

  async function submitPost() {
    await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameId,
        content: text,
        authorId: clientId,
      }),
    });

    setText("");
    mutate();
  }

  return (
    <section>
      <h2>Posts</h2>

      <textarea
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a post about this game..."
      />

      <button onClick={submitPost}>Post</button>

      <PostList posts={posts} onPostsChange={() => mutate()} />
    </section>
  );
}
