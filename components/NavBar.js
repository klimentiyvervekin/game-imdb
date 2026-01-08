import Link from "next/link";
import { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

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
  const { data: session } = useSession();

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

      <span style={{ flex: 1 }} />

      {session?.user ? (
        <>
          <span style={{ fontSize: 12, opacity: 0.7 }}>
            {session.user.email}
          </span>
          <button type="button" onClick={() => signOut()}>
            Logout
          </button>
        </>
      ) : (
        <button type="button" onClick={() => signIn("google")}>
          Login with Google
        </button>
      )}
    </div>
  );
}
