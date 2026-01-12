import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import {
  getFollowingUsers,
  getFollowingGames,
  toggleFollowUser,
  toggleFollowGame,
} from "@/lib/following";

const fetcher = (url) => fetch(url).then((r) => r.json());

// this is only for local storage - dont need this anymore
function getLocalProfile(userId) {
  if (typeof window === "undefined") return { name: "User", avatarUrl: "" }; // если код на сервере то сторедж недоступен
  const raw = localStorage.getItem(`profile:${userId}`); // ключ
  if (!raw) return { name: "User", avatarUrl: "" };
  try {
    return JSON.parse(raw);
  } catch {
    return { name: "User", avatarUrl: "" };
  }
}

export default function FollowingPage() {
  const { data: session, status } = useSession();
  const myUserId = session?.user?.dbUserId || null;

  // ХУКИ — ВСЕГДА СВЕРХУ, ДО ЛЮБЫХ return
  const [userIds, setUserIds] = useState([]);
  const [gameIds, setGameIds] = useState([]);

  const { data: games } = useSWR(myUserId ? "/api/games" : null, fetcher);

  useEffect(() => {
    // можно грузить даже если не залогинен. это просто localStorage (больше не нужен код)
    setUserIds(getFollowingUsers());
    setGameIds(getFollowingGames());
  }, []);

  // тоже не нужно
  const followedGames = useMemo(() => {
    if (!Array.isArray(games)) return [];
    const set = new Set(gameIds.map(String));
    return games.filter((g) => set.has(String(g._id)));
  }, [games, gameIds]);

  function unfollowUser(id) {
    const next = toggleFollowUser(id);
    setUserIds(next);
  }

  function unfollowGame(id) {
    const next = toggleFollowGame(id);
    setGameIds(next);
  }

  // теперь уже можно делать ранние return
  if (status === "loading") {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
        <h1 style={{ marginTop: 0 }}>Following</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (!myUserId) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
        <h1 style={{ marginTop: 0 }}>Following</h1>
        <p>Please sign in to see who you follow (users and games).</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h1 style={{ marginTop: 0 }}>Following</h1>

      {/* USERS */}
      <div style={{ marginTop: 16 }}>
        <h2 style={{ margin: 0 }}>Users</h2>

        {userIds.length === 0 && (
          <p style={{ opacity: 0.7 }}>No followed users</p>
        )}

        <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
          {userIds.map((id) => {
            const p = getLocalProfile(id);
            return (
              <div
                key={id}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 10,
                  padding: 12,
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 999,
                    overflow: "hidden",
                    background: "#eee",
                    flexShrink: 0,
                  }}
                >
                  {p.avatarUrl ? (
                    <Image
                      src={p.avatarUrl}
                      alt=""
                      width={44}
                      height={44}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "grid",
                        placeItems: "center",
                        opacity: 0.6,
                      }}
                    >
                      🙂
                    </div>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{p.name || "User"}</div>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>id: {id}</div>
                  <Link href={`/users/${id}`}>Open profile</Link>
                </div>

                <button type="button" onClick={() => unfollowUser(id)}>
                  Unfollow
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* GAMES */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ margin: 0 }}>Games</h2>

        {gameIds.length === 0 && (
          <p style={{ opacity: 0.7 }}>No followed games</p>
        )}
        {gameIds.length > 0 && !games && <p>Loading games...</p>}

        <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
          {followedGames.map((g) => (
            <div
              key={g._id}
              style={{
                border: "1px solid #eee",
                borderRadius: 10,
                padding: 12,
                display: "flex",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{g.title}</div>
                {g.slug ? (
                  <Link href={`/games/${g.slug}`}>Open game</Link>
                ) : (
                  <span style={{ opacity: 0.7 }}>(no slug)</span>
                )}
              </div>

              <button type="button" onClick={() => unfollowGame(g._id)}>
                Unfollow
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
