// pages/users/[id].js--------------
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import useSWR from "swr";
import Image from "next/image";
import Link from "next/link";
import { isFollowingUser, toggleFollowUser } from "@/lib/following";
import { useSession } from "next-auth/react";
import styled from "styled-components";

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

    (async () => {
      const ok = await isFollowingUser(userId);
      setFollowed(ok);
    })();
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

  if (!userId) {
    return (
      <InlineState>
        <InlineTitle>Loading…</InlineTitle>
        <InlineText>Please wait while your profile is loading</InlineText>
      </InlineState>
    );
  }

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
    <Page>
      <Title>Profile</Title>

      {profileError && <ErrorText>Failed to load profile</ErrorText>}
      {!profile && !profileError && <MutedText>Loading profile...</MutedText>}

      {profile && (
        <>
          {/* header */}
          <Header>
            <AvatarWrap>
              {profile.avatarUrl ? (
                <AvatarImg
                  src={profile.avatarUrl}
                  alt=""
                  width={80}
                  height={80}
                />
              ) : (
                <AvatarFallback>No photo</AvatarFallback>
              )}
            </AvatarWrap>

            {isMe && (
              <AvatarControls>
                <FileInput
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
                  <SmallMuted>Uploading avatar...</SmallMuted>
                )}

                {avatarError && <ErrorText>{avatarError}</ErrorText>}
              </AvatarControls>
            )}

            <HeaderMain>
              <NameLine>{profile.name || "User"}</NameLine>
              <IdLine>id: {userId}</IdLine>

              {profile.bio && <Bio>{profile.bio}</Bio>}

              <ActionsRow>
                <TabButton
                  type="button"
                  onClick={() => setTab("posts")}
                  disabled={tab === "posts"}
                >
                  Posts
                </TabButton>
                <TabButton
                  type="button"
                  onClick={() => setTab("reviews")}
                  disabled={tab === "reviews"}
                >
                  Reviews
                </TabButton>

                <Spacer />

                {!isMe && (
                  <PrimaryButton
                    type="button"
                    onClick={async () => {
                      const nextIds = await toggleFollowUser(userId);
                      setFollowed(
                        Array.isArray(nextIds) &&
                          nextIds.includes(String(userId))
                      );
                    }}
                  >
                    {followed ? "Unfollow" : "Follow"}
                  </PrimaryButton>
                )}

                {/* редактировать можно только свой профиль */}
                {isMe && (
                  <SecondaryButton
                    type="button"
                    onClick={() => setEditMode((v) => !v)}
                  >
                    {editMode ? "Close edit" : "Edit profile"}
                  </SecondaryButton>
                )}
              </ActionsRow>
            </HeaderMain>
          </Header>

          {/* Edit profile (server) */}
          {editMode && (
            <EditCard>
              <FormGrid>
                <Field>
                  Name
                  <TextInput
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                  />
                </Field>

                <Field>
                  Bio
                  <TextArea
                    rows={3}
                    value={bioDraft}
                    onChange={(e) => setBioDraft(e.target.value)}
                  />
                </Field>

                {saveError && <ErrorText>{saveError}</ErrorText>}

                <ButtonsRow>
                  <PrimaryButton type="button" onClick={saveProfile}>
                    Save
                  </PrimaryButton>
                  <SecondaryButton
                    type="button"
                    onClick={() => {
                      setEditMode(false);
                      setNameDraft(profile.name || "User");
                      setBioDraft(profile.bio || "");
                      setSaveError("");
                    }}
                  >
                    Cancel
                  </SecondaryButton>
                </ButtonsRow>
              </FormGrid>
            </EditCard>
          )}

          {/* Content */}
          <Content>
            {tab === "posts" && (
              <>
                <SectionTitle>Posts</SectionTitle>

                {postsError && <ErrorText>Failed to load posts</ErrorText>}
                {!posts && !postsError && <MutedText>Loading...</MutedText>}
                {Array.isArray(posts) && posts.length === 0 && (
                  <MutedText>No posts yet</MutedText>
                )}

                {Array.isArray(posts) &&
                  posts.map((p) => (
                    <ContentCard key={p._id}>
                      <CardMeta>
                        {new Date(p.createdAt).toLocaleString()}
                        {" • "}
                        {p.gameId?.slug ? (
                          <Link href={`/games/${p.gameId.slug}`}>
                            {p.gameId.title || p.gameId.slug}
                          </Link>
                        ) : (
                          <span>(no game)</span>
                        )}
                      </CardMeta>

                      <CardText>{p.content}</CardText>

                      {p.imageUrl && (
                        <MediaImage
                          src={p.imageUrl}
                          alt=""
                          width={800}
                          height={450}
                        />
                      )}

                      {p.videoUrl && <MediaVideo src={p.videoUrl} controls />}
                    </ContentCard>
                  ))}
              </>
            )}

            {tab === "reviews" && (
              <>
                <SectionTitle>Reviews</SectionTitle>

                {reviewsError && <ErrorText>Failed to load reviews</ErrorText>}
                {!reviews && !reviewsError && <MutedText>Loading...</MutedText>}
                {Array.isArray(reviews) && reviews.length === 0 && (
                  <MutedText>No reviews yet</MutedText>
                )}

                {Array.isArray(reviews) &&
                  reviews.map((r) => (
                    <ContentCard key={r._id}>
                      <CardMeta>
                        {new Date(r.createdAt).toLocaleString()} • rating:{" "}
                        {r.rating}/10
                        {r.hasSpoilers && <span> • ⚠️ Spoilers</span>}
                      </CardMeta>

                      <CardMeta style={{ marginTop: 6 }}>
                        {r.gameId?.slug ? (
                          <Link href={`/games/${r.gameId.slug}`}>
                            Game: {r.gameId.title || r.gameId.slug}
                          </Link>
                        ) : (
                          <span>Game: (unknown)</span>
                        )}
                      </CardMeta>

                      <CardText style={{ marginTop: 8 }}>{r.text}</CardText>

                      {Array.isArray(r.updates) && r.updates.length > 0 && (
                        <Updates>
                          <UpdatesTitle>Updates</UpdatesTitle>

                          <UpdatesGrid>
                            {r.updates.map((u, i) => (
                              <UpdateCard key={u.createdAt + i}>
                                <SmallMuted>
                                  {new Date(u.createdAt).toLocaleString()}
                                  {u.hasSpoilers && <span> • ⚠️ Spoilers</span>}
                                </SmallMuted>
                                <UpdateText>{u.text}</UpdateText>
                              </UpdateCard>
                            ))}
                          </UpdatesGrid>
                        </Updates>
                      )}
                    </ContentCard>
                  ))}
              </>
            )}
          </Content>
        </>
      )}
    </Page>
  );
}

/* ===================== styles ===================== */

const Page = styled.div`
  --color-bg: #ffffff;
  --color-surface: #ffffff;
  --color-text: #111827;
  --color-muted: #6b7280;
  --color-border: #e5e7eb;

  --color-primary: #4f46e5;
  --color-primary-hover: #4338ca;

  --color-danger: #dc2626;

  --font-sm: 12px;
  --font-md: 14px;
  --font-lg: 28px;
  --font-xl: 18px;

  --space-2xs: 4px;
  --space-xs: 6px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 24px;
  --space-2xl: 40px;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-pill: 999px;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);

  max-width: 900px;
  margin: 0 auto;
  padding: var(--space-lg);
  color: var(--color-text);

  a {
    color: var(--color-primary);
    text-decoration: none;
    font-weight: 600;
  }

  a:hover {
    color: var(--color-primary-hover);
    text-decoration: underline;
  }

  @media (min-width: 768px) {
    padding: 18px;
  }

  @media (max-width: 520px) {
    padding: var(--space-md);
  }
`;

const Title = styled.h1`
  margin: 0 auto var(--space-xl);
  max-width: 720px;
  text-align: center;
  font-size: var(--font-lg);
  line-height: 1.1;
`;

const Header = styled.div`
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  gap: var(--space-lg);
  align-items: center;
  padding: var(--space-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);

  @media (max-width: 900px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: var(--space-md);
    padding: var(--space-md);
  }
`;

const AvatarWrap = styled.div`
  width: 80px;
  height: 80px;
  border-radius: var(--radius-pill);
  overflow: hidden;
  background: var(--color-border);
  flex-shrink: 0;

  @media (max-width: 900px) {
    width: 72px;
    height: 72px;
  }
`;

const AvatarImg = styled(Image)`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const AvatarFallback = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  opacity: 0.7;
  font-size: var(--font-sm);
`;

const AvatarControls = styled.div`
  margin-top: var(--space-sm);

  @media (max-width: 900px) {
    width: 100%;
    display: flex;
    justify-content: center;
    margin-top: var(--space-sm);
  }
`;

const HeaderMain = styled.div`
  flex: 1;
  min-width: 0;

  @media (max-width: 900px) {
    width: 100%;
  }
`;

const NameLine = styled.div`
  font-size: 20px;
  font-weight: 800;
  line-height: 1.2;

  @media (max-width: 900px) {
    font-size: 18px;
  }
`;

const IdLine = styled.div`
  margin-top: var(--space-2xs);
  font-size: var(--font-sm);
  color: var(--color-muted);
  opacity: 0.85;
  word-break: break-word;
`;

const Bio = styled.div`
  margin-top: var(--space-sm);
  font-size: 13px;
  opacity: 0.9;
  line-height: 1.45;
`;

const ActionsRow = styled.div`
  margin-top: var(--space-md);
  display: flex;
  gap: var(--space-sm);
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 900px) {
    width: 100%;
    justify-content: center;

    /* кнопки ровные и не узкие */
    & > button {
      min-width: 140px;
      justify-content: center;
    }
  }
`;

const Spacer = styled.span`
  flex: 1;

  /* на узких экранах Spacer только мешает */
  @media (max-width: 900px) {
    display: none;
  }
`;

const BaseButton = styled.button`
  appearance: none;
  border: 1px solid var(--color-border);
  background: #fff;
  color: var(--color-text);
  font-weight: 700;
  font-size: var(--font-md);
  padding: 9px 12px;
  border-radius: var(--radius-pill);
  cursor: pointer;
  white-space: nowrap;

  &:disabled {
    opacity: 0.55;
    cursor: default;
  }
`;

const TabButton = styled(BaseButton)`
  background: rgba(17, 24, 39, 0.02);

  &:disabled {
    opacity: 1;
    background: rgba(79, 70, 229, 0.08);
    border-color: rgba(79, 70, 229, 0.18);
    color: var(--color-primary);
  }
`;

const PrimaryButton = styled(BaseButton)`
  border-color: rgba(79, 70, 229, 0.25);
  background: rgba(79, 70, 229, 0.08);
  color: var(--color-primary);

  &:hover:not(:disabled) {
    background: rgba(79, 70, 229, 0.12);
    border-color: rgba(79, 70, 229, 0.35);
  }
`;

const SecondaryButton = styled(BaseButton)`
  background: rgba(17, 24, 39, 0.02);

  &:hover:not(:disabled) {
    background: rgba(17, 24, 39, 0.05);
  }
`;

const EditCard = styled.div`
  max-width: 720px;
  margin: var(--space-lg) auto 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  padding: var(--space-lg);

  @media (max-width: 520px) {
    padding: var(--space-md);
  }
`;

const FormGrid = styled.div`
  display: grid;
  gap: var(--space-md);
`;

const Field = styled.label`
  display: grid;
  gap: var(--space-xs);
  font-size: var(--font-md);
  font-weight: 700;
`;

const TextInput = styled.input`
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-md);
`;

const TextArea = styled.textarea`
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-md);
  resize: vertical;
`;

const ButtonsRow = styled.div`
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;

  @media (max-width: 520px) {
    & > button {
      flex: 1;
      min-width: 140px;
    }
  }
`;

const Content = styled.div`
  max-width: 720px;
  margin: var(--space-xl) auto 0;
`;

const SectionTitle = styled.h2`
  margin: 0 0 var(--space-md);
  text-align: center;
  font-size: var(--font-xl);
  line-height: 1.2;
`;

const ContentCard = styled.div`
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);

  padding: var(--space-lg);
  margin-bottom: var(--space-md);

  @media (max-width: 520px) {
    padding: var(--space-md);
  }
`;

const CardMeta = styled.div`
  font-size: var(--font-sm);
  color: var(--color-muted);
  opacity: 0.9;
  line-height: 1.35;
  word-break: break-word;
`;

const CardText = styled.div`
  margin-top: var(--space-sm);
  font-size: var(--font-md);
  line-height: 1.5;
  word-break: break-word;
`;

const MediaImage = styled(Image)`
  width: 100%;
  height: auto;
  display: block;
  margin-top: var(--space-md);
  border-radius: var(--radius-md);
  background: rgba(17, 24, 39, 0.04);

  /* not giant */
  max-height: 520px;
  object-fit: contain;
`;

const MediaVideo = styled.video`
  width: 100%;
  display: block;
  margin-top: var(--space-md);
  border-radius: var(--radius-md);
`;

const Updates = styled.div`
  margin-top: var(--space-lg);
  padding-top: var(--space-lg);
  border-top: 1px solid rgba(229, 231, 235, 0.9);
`;

const UpdatesTitle = styled.strong`
  display: block;
  font-size: 13px;
  margin-bottom: var(--space-sm);
`;

const UpdatesGrid = styled.div`
  display: grid;
  gap: var(--space-md);
`;

const UpdateCard = styled.div`
  font-size: 13px;
  padding: var(--space-sm);
  border: 1px solid rgba(229, 231, 235, 0.9);
  border-radius: var(--radius-sm);
  background: rgba(17, 24, 39, 0.02);
`;

const UpdateText = styled.div`
  margin-top: var(--space-xs);
  line-height: 1.45;
  word-break: break-word;
`;

const ErrorText = styled.p`
  margin: var(--space-sm) 0 0;
  color: crimson;
  font-size: var(--font-md);
`;

const MutedText = styled.p`
  margin: 24px auto 0;
  max-width: 520px;

  padding: 14px 18px;
  text-align: center;

  color: var(--color-muted);
  font-size: var(--font-md);
  line-height: 1.4;

  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(17, 24, 39, 0.02);
`;

const SmallMuted = styled.p`
  margin: var(--space-xs) 0 0;
  font-size: var(--font-sm);
  color: var(--color-muted);
  opacity: 0.85;
`;

const FileInput = styled.input`
  width: 100%;
  max-width: 320px;

  font-size: var(--font-sm);
  color: var(--color-muted);

  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(17, 24, 39, 0.02);

  padding: 10px 12px;
  cursor: pointer;

  transition: background 0.15s ease, border-color 0.15s ease;

  &:hover:not(:disabled) {
    background: rgba(17, 24, 39, 0.04);
    border-color: rgba(79, 70, 229, 0.25);
  }

  &:focus {
    outline: none;
    border-color: rgba(79, 70, 229, 0.35);
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* button on top */
  &::file-selector-button {
    display: block;
    width: fit-content;

    appearance: none;
    border: 1px solid rgba(79, 70, 229, 0.25);
    background: rgba(79, 70, 229, 0.1);
    color: var(--color-primary);

    font-weight: 800;
    font-size: var(--font-sm);

    padding: 7px 14px;
    border-radius: var(--radius-pill);
    margin-bottom: 6px;

    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;
  }

  &::file-selector-button:hover {
    background: rgba(79, 70, 229, 0.14);
    border-color: rgba(79, 70, 229, 0.35);
  }

  &::-webkit-file-upload-button {
    display: block;
    width: fit-content;

    appearance: none;
    border: 1px solid rgba(79, 70, 229, 0.25);
    background: rgba(79, 70, 229, 0.1);
    color: var(--color-primary);

    font-weight: 800;
    font-size: var(--font-sm);

    padding: 7px 14px;
    border-radius: var(--radius-pill);
    margin-bottom: 6px;

    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;
  }

  &::-webkit-file-upload-button:hover {
    background: rgba(79, 70, 229, 0.14);
    border-color: rgba(79, 70, 229, 0.35);
  }
`;

const InlineState = styled.div`
  margin: 48px auto;
  padding: 28px 22px;
  max-width: 520px;

  border: 1px dashed #e5e7eb;
  border-radius: 12px;
  background: rgba(17, 24, 39, 0.02);

  text-align: center;
`;

const InlineTitle = styled.div`
  font-size: 16px;
  font-weight: 800;
  color: #111827;
`;

const InlineText = styled.div`
  margin-top: 6px;
  font-size: 13px;
  color: #6b7280;
`;
