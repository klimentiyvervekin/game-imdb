import Link from "next/link";
import { useEffect, useState } from "react";

function getClientId() {
  if (typeof window === "undefined") return null;

  let id = localStorage.getItem("clientId");
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem("clientId", id);
  }
  return id;
}

export default function NavBar() {
  const [clientId, setClientId] = useState(null);

  useEffect(() => {
    const id = getClientId();
    setClientId(id);

    // создаём юзера если его нет
    fetch("/api/users/me", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: id }),
    }).catch(() => {});
  }, []);

  return (
    <div
      style={{
        borderBottom: "1px solid #eee",
        padding: 12,
        display: "flex",
        gap: 12,
      }}
    >
      <Link href="/">Home</Link>

      {/* profil page = /users/<clientId> */}
      {clientId ? <Link href={`/users/${clientId}`}>Profile</Link> : <span>Profile</span>}

      <Link href="/bookmarks">Following</Link>
      <Link href="/likes">Likes</Link>
    </div>
  );
}
