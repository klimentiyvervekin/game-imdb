import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

export default function NavBar() {
  const { data: session } = useSession();
  const myUserId = session?.user?.dbUserId || null;

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

      {myUserId ? (
        <Link href={`/users/${myUserId}`}>Profile</Link>
      ) : (
        <button
          type="button"
          onClick={() => alert("Please log in to open your profile")}
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
        >
          Profile
        </button>
      )}

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
