// components/PostSection.js DONT NEED THIS ANYMORE
import { useState } from "react";
import useSWR from "swr";
import PostList from "./PostList";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function PostSection({ gameId }) {
  const { data: session } = useSession();
  const myUserId = session?.user?.dbUserId || null; // mongo user id

  const { data: posts, mutate } = useSWR(
    gameId ? `/api/posts?gameId=${gameId}` : null,
    fetcher
  );

  const [text, setText] = useState("");

  async function submitPost() {
    if (!myUserId) {
      alert(
        "Please log in or sign in to write posts, like and comment."
      );
      return;
    }

    await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameId,
        content: text,
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
