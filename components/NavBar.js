// components/NavBar.js
import Link from "next/link";
import { useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

export default function NavBar() {
  const { data: session, status } = useSession();

  // на всякий случай "убеждаемся", что юзер есть в Mongo
  // (теперь без clientId, сервер сам берёт dbUserId из session)
  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/users/me", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).catch(() => {});
  }, [status]);

  const myId = session?.user?.dbUserId || null;

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

      {/* профиль есть только у залогиненного */}
      {myId ? <Link href={`/users/${myId}`}>Profile</Link> : <span>Profile</span>}

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
