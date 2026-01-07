import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import useSWR from "swr";
import Image from "next/image";
import Link from "next/link";
import { isFollowingUser, toggleFollowUser } from "@/lib/following";

const fetcher = (url) => fetch(url).then((r) => r.json());

function getLocalProfile(userId) {
  if (typeof window === "undefined") return { name: "User", avatarUrl: "" };

  const key = `profile:${userId}`;
  const raw = localStorage.getItem(key);
  if (!raw) return { name: "User", avatarUrl: "" };

  try {
    return JSON.parse(raw);
  } catch {
    return { name: "User", avatarUrl: "" };
  }
}

function setLocalProfile(userId, data) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`profile:${userId}`, JSON.stringify(data));
}

export default function UserProfilePage() {
  const router = useRouter();

  // ✅ userId может быть undefined на первом рендере → делаем безопасно
  const userIdRaw = router.query.id;
  const userId = Array.isArray(userIdRaw) ? userIdRaw[0] : userIdRaw;

  const [tab, setTab] = useState("posts"); // "posts" | "reviews"
  const [editMode, setEditMode] = useState(false);

  // profile из localStorage
  const [profile, setProfile] = useState({ name: "User", avatarUrl: "" });

  // drafts
  const [nameDraft, setNameDraft] = useState("User");
  const [avatarDraft, setAvatarDraft] = useState("");

  const [followed, setFollowed] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setFollowed(isFollowingUser(userId));
  }, [userId]);

  // ✅ когда userId появился/поменялся → загрузим профиль
  useEffect(() => {
    if (!userId) return;

    const p = getLocalProfile(userId);
    setProfile(p);

    // обновим поля редактирования тоже
    setNameDraft(p.name || "User");
    setAvatarDraft(p.avatarUrl || "");
  }, [userId]);

  // ✅ SWR хуки всегда вызываются, но запрос будет только если key не null
  const postsKey =
    userId && tab === "posts" ? `/api/users/${userId}/posts` : null;
  const reviewsKey =
    userId && tab === "reviews" ? `/api/users/${userId}/reviews` : null;

  const { data: posts, error: postsError } = useSWR(postsKey, fetcher);
  const { data: reviews, error: reviewsError } = useSWR(reviewsKey, fetcher);

  // ✅ early return делаем ТОЛЬКО ПОСЛЕ всех hooks
  if (!userId) return <p>Loading...</p>;

  function saveProfile() {
    const newProfile = {
      name: nameDraft || "User",
      avatarUrl: avatarDraft || "",
    };

    setLocalProfile(userId, newProfile);
    setProfile(newProfile);
    setEditMode(false);
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h1 style={{ marginTop: 0 }}>Profile</h1>

      {/* Header */}
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 999,
            overflow: "hidden",
            background: "#eee",
          }}
        >
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt=""
              width={80}
              height={80}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
              No photo
            </div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{profile.name}</div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>id: {userId}</div>

          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => setTab("posts")}
              disabled={tab === "posts"}
            >
              Posts
            </button>
            <button
              type="button"
              onClick={() => setTab("reviews")}
              disabled={tab === "reviews"}
            >
              Reviews
            </button>

            <span style={{ flex: 1 }} />

            <button
              type="button"
              onClick={() => {
                toggleFollowUser(userId);
                setFollowed(isFollowingUser(userId));
              }}
            >
              {followed ? "Unfollow" : "Follow"}
            </button>

            <button type="button" onClick={() => setEditMode((v) => !v)}>
              {editMode ? "Close edit" : "Edit profile (local)"}
            </button>
          </div>
        </div>
      </div>

      {/* Edit profile (localStorage) */}
      {editMode && (
        <div
          style={{
            marginTop: 12,
            border: "1px solid #ddd",
            borderRadius: 10,
            padding: 12,
          }}
        >
          <div style={{ display: "grid", gap: 8 }}>
            <label>
              Name
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                style={{ width: "100%", marginTop: 4 }}
              />
            </label>

            <label>
              Avatar URL (пока просто url)
              <input
                value={avatarDraft}
                onChange={(e) => setAvatarDraft(e.target.value)}
                placeholder="https://..."
                style={{ width: "100%", marginTop: 4 }}
              />
            </label>

            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={saveProfile}>
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditMode(false);
                  setNameDraft(profile.name || "User");
                  setAvatarDraft(profile.avatarUrl || "");
                }}
              >
                Cancel
              </button>
            </div>

            <div style={{ fontSize: 12, opacity: 0.7 }}>
              * Это заглушка в localStorage. Потом заменю на нормальную таблицу
              Users
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ marginTop: 16 }}>
        {tab === "posts" && (
          <>
            <h2 style={{ marginTop: 0 }}>Posts</h2>

            {postsError && (
              <p style={{ color: "crimson" }}>Failed to load posts</p>
            )}
            {!posts && !postsError && <p>Loading...</p>}
            {Array.isArray(posts) && posts.length === 0 && <p>No posts yet</p>}

            {Array.isArray(posts) &&
              posts.map((p) => (
                <div
                  key={p._id}
                  style={{
                    border: "1px solid #eee",
                    padding: 12,
                    borderRadius: 10,
                    marginBottom: 10,
                  }}
                >
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {new Date(p.createdAt).toLocaleString()}
                    {" • "}
                    {p.gameId?.slug ? (
                      <Link href={`/games/${p.gameId.slug}`}>
                        {p.gameId.title || p.gameId.slug}
                      </Link>
                    ) : (
                      <span>(no game)</span>
                    )}
                  </div>

                  <div style={{ marginTop: 6 }}>{p.content}</div>

                  {p.imageUrl && (
                    <Image
                      src={p.imageUrl}
                      alt=""
                      width={800}
                      height={450}
                      style={{
                        width: "100%",
                        height: "auto",
                        borderRadius: 10,
                        marginTop: 8,
                      }}
                    />
                  )}

                  {p.videoUrl && (
                    <video
                      src={p.videoUrl}
                      controls
                      style={{ width: "100%", borderRadius: 10, marginTop: 8 }}
                    />
                  )}
                </div>
              ))}
          </>
        )}

        {tab === "reviews" && (
          <>
            <h2 style={{ marginTop: 0 }}>Reviews</h2>

            {reviewsError && (
              <p style={{ color: "crimson" }}>Failed to load reviews</p>
            )}
            {!reviews && !reviewsError && <p>Loading...</p>}
            {Array.isArray(reviews) && reviews.length === 0 && (
              <p>No reviews yet</p>
            )}

            {Array.isArray(reviews) &&
              reviews.map((r) => (
                <div
                  key={r._id}
                  style={{
                    border: "1px solid #eee",
                    padding: 12,
                    borderRadius: 10,
                    marginBottom: 10,
                  }}
                >
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {new Date(r.createdAt).toLocaleString()} • rating:{" "}
                    {r.rating}/10
                    {r.hasSpoilers && <span> • ⚠️ Spoilers</span>}
                  </div>

                  <div style={{ marginTop: 6 }}>
                    {r.gameId?.slug ? (
                      <Link href={`/games/${r.gameId.slug}`}>
                        Game: {r.gameId.title || r.gameId.slug}
                      </Link>
                    ) : (
                      <span>Game: (unknown)</span>
                    )}
                  </div>

                  <div style={{ marginTop: 8 }}>{r.text}</div>

                  {Array.isArray(r.updates) && r.updates.length > 0 && (
                    <div
                      style={{
                        marginTop: 10,
                        paddingTop: 10,
                        borderTop: "1px solid #f0f0f0",
                      }}
                    >
                      <strong style={{ fontSize: 13 }}>Updates</strong>

                      <div style={{ display: "grid", gap: 8, marginTop: 6 }}>
                        {r.updates.map((u, i) => (
                          <div key={u.createdAt + i} style={{ fontSize: 13 }}>
                            <div style={{ fontSize: 12, opacity: 0.7 }}>
                              {new Date(u.createdAt).toLocaleString()}
                              {u.hasSpoilers && <span> • ⚠️ Spoilers</span>}
                            </div>
                            <div style={{ marginTop: 4 }}>{u.text}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
}
