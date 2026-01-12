// components/SearchBar.js
import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function SearchBar() {
  const { data: session, status } = useSession();
  const myUserId = session?.user?.dbUserId || null;

  const [q, setQ] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function search(e) {
    e.preventDefault();
    setErr("");

    if (status === "loading") return;
    if (!myUserId) {
      setErr("Please, log in to use search.");
      return;
    }

    const query = q.trim();
    if (!query) {
      setData(null);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (!res.ok) {
        setErr(json?.error || "Search failed");
        setData(null);
        return;
      }
      setData(json);
    } catch (e2) {
      setErr(e2.message || "Search failed");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  const users = Array.isArray(data?.users) ? data.users : [];
  const games = Array.isArray(data?.games) ? data.games : [];

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
      <form onSubmit={search} style={{ display: "flex", gap: 8 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search games or users..."
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {err && <p style={{ color: "crimson", marginTop: 8 }}>{err}</p>}

      {data && (
        <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
          <div>
            <strong>Users</strong>
            {users.length === 0 ? (
              <div style={{ opacity: 0.7, marginTop: 6 }}>No users found</div>
            ) : (
              <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
                {users.map((u) => (
                  <Link key={u._id} href={`/users/${u._id}`}>
                    {u.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div>
            <strong>Games</strong>
            {games.length === 0 ? (
              <div style={{ opacity: 0.7, marginTop: 6 }}>No games found</div>
            ) : (
              <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
                {games.map((g) => (
                  <Link key={g.id} href={`/games/${g.slug}`}>
                    {g.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
