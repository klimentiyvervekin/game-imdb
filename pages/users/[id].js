// pages/users/[id].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import useSWR from "swr";
import Image from "next/image";
import Link from "next/link";
import { isFollowingUser, toggleFollowUser } from "@/lib/following";
import { useSession } from "next-auth/react";

const fetcher = async (url) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Failed to load");
  return json;
};

export default function UserProfilePage() {
  const router = useRouter();
  const { data: session } = useSession();

  const userIdRaw = router.query.id;
  const userId = Array.isArray(userIdRaw) ? userIdRaw[0] : userIdRaw;

  const myId = session?.user?.dbUserId || null;
  const isMe = myId && userId && String(myId) === String(userId);

  const [tab, setTab] = useState("posts"); // "posts" | "reviews"
  const [editMode, setEditMode] = useState(false);

  // profile (server)
  const {
    data: profile,
    error: profileError,
    mutate: mutateProfile,
  } = useSWR(userId ? `/api/users/${userId}` : null, fetcher);

  // drafts (for edit)
  const [nameDraft, setNameDraft] = useState("User");
  const [bioDraft, setBioDraft] = useState("");
  const [saveError, setSaveError] = useState("");

  const [followed, setFollowed] = useState(false);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  useEffect(() => {
    if (!userId) return;
    setFollowed(isFollowingUser(userId));
  }, [userId]);

  // when profile loaded -> fill drafts
  useEffect(() => {
    if (!profile) return;
    setNameDraft(profile.name || "User");
    setBioDraft(profile.bio || "");
  }, [profile]);

  const postsKey =
    userId && tab === "posts" ? `/api/users/${userId}/posts` : null;
  const reviewsKey =
    userId && tab === "reviews" ? `/api/users/${userId}/reviews` : null;

  const { data: posts, error: postsError } = useSWR(postsKey, fetcher);
  const { data: reviews, error: reviewsError } = useSWR(reviewsKey, fetcher);

  if (!userId) return <p>Loading...</p>;

  //--------- 2 helper function for avatar upload -----------//
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // simple client-side resize/compress
  async function compressImage(file, maxSize = 512, quality = 0.8) {
    const imgUrl = URL.createObjectURL(file);
    const img = new window.Image();
    img.src = imgUrl;
    await new Promise((r) => (img.onload = r));

    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, w, h);

    URL.revokeObjectURL(imgUrl);

    // jpg is good for size
    return canvas.toDataURL("image/jpeg", quality);
  }

  async function uploadAvatar(file) {
    setAvatarError("");
    setAvatarUploading(true);

    try {
      // 1 compress
      const base64 = await compressImage(file, 512, 0.8);

      // 2 upload to cloudinary via API
      const up = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: base64, kind: "avatar" }),
      });

      const upJson = await up.json();
      if (!up.ok) {
        setAvatarError(upJson?.error || "Upload failed");
        return;
      }

      // 3 save avatarUrl to my user in DB
      const save = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameDraft,
          bio: bioDraft,
          avatarUrl: upJson.url, // here save
        }),
      });

      const saveJson = await save.json();
      if (!save.ok) {
        setAvatarError(saveJson?.error || "Failed to save avatar");
        return;
      }

      mutateProfile(); // update UI
    } catch (e) {
      setAvatarError(e.message || "Upload failed");
    } finally {
      setAvatarUploading(false);
    }
  }
  //----------------------------------------------------//

  async function saveProfile() {
    setSaveError("");

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameDraft,
          bio: bioDraft,
          avatarUrl: profile?.avatarUrl || "",
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setSaveError(json?.error || "Failed to save");
        return;
      }

      setEditMode(false);
      mutateProfile(); // refresh
    } catch (e) {
      setSaveError(e.message || "Failed to save");
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h1 style={{ marginTop: 0 }}>Profile</h1>

      {profileError && (
        <p style={{ color: "crimson" }}>Failed to load profile</p>
      )}
      {!profile && !profileError && <p>Loading profile...</p>}

      {profile && (
        <>
          {/* header */}
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

            {isMe && (
              <div style={{ marginTop: 8 }}>
                <input
                  type="file"
                  accept="image/*"
                  disabled={avatarUploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;

                    // простая защита. (только картинки и не огромные)
                    if (!f.type.startsWith("image/")) {
                      setAvatarError("Please select an image file.");
                      return;
                    }

                    uploadAvatar(f);
                    e.target.value = ""; // чтобы можно было выбрать тот же файл ещё раз
                  }}
                />

                {avatarUploading && (
                  <p style={{ fontSize: 12, opacity: 0.7 }}>
                    Uploading avatar...
                  </p>
                )}

                {avatarError && (
                  <p style={{ color: "crimson" }}>{avatarError}</p>
                )}
              </div>
            )}

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                {profile.name || "User"}
              </div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>id: {userId}</div>

              {profile.bio && (
                <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
                  {profile.bio}
                </div>
              )}

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

                {!isMe && (
                  <button
                    type="button"
                    onClick={() => {
                      toggleFollowUser(userId);
                      setFollowed(isFollowingUser(userId));
                    }}
                  >
                    {followed ? "Unfollow" : "Follow"}
                  </button>
                )}

                {/* редактировать можно только свой профиль */}
                <button
                  type="button"
                  onClick={() => setEditMode((v) => !v)}
                  disabled={!isMe}
                  title={!isMe ? "You can edit only your profile" : ""}
                >
                  {editMode ? "Close edit" : "Edit profile"}
                </button>
              </div>
            </div>
          </div>

          {/* Edit profile (server) */}
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
                  Bio
                  <textarea
                    rows={3}
                    value={bioDraft}
                    onChange={(e) => setBioDraft(e.target.value)}
                    style={{ width: "100%", marginTop: 4 }}
                  />
                </label>

                {saveError && <p style={{ color: "crimson" }}>{saveError}</p>}

                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={saveProfile}>
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(false);
                      setNameDraft(profile.name || "User");
                      setBioDraft(profile.bio || "");
                      setSaveError("");
                    }}
                  >
                    Cancel
                  </button>
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
                {Array.isArray(posts) && posts.length === 0 && (
                  <p>No posts yet</p>
                )}

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
                          style={{
                            width: "100%",
                            borderRadius: 10,
                            marginTop: 8,
                          }}
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

                          <div
                            style={{ display: "grid", gap: 8, marginTop: 6 }}
                          >
                            {r.updates.map((u, i) => (
                              <div
                                key={u.createdAt + i}
                                style={{ fontSize: 13 }}
                              >
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
        </>
      )}
    </div>
  );
}
