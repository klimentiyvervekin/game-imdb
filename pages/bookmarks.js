import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import styled from "styled-components";
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

  // ✅ добавили: имена/аватары юзеров по id
  const [followedUsers, setFollowedUsers] = useState({});

  const { data: games } = useSWR(myUserId ? "/api/games" : null, fetcher);

  useEffect(() => {
    // можно грузить даже если не залогинен. это просто localStorage (больше не нужен код)
    const uids = getFollowingUsers();
    setUserIds(uids);
    setGameIds(getFollowingGames());

    // ✅ грузим реальные профили из Mongo через твой API /api/users/[id]
    (async () => {
      try {
        const entries = await Promise.all(
          uids.map(async (id) => {
            const r = await fetch(`/api/users/${id}`);
            if (!r.ok) return [id, null];
            const u = await r.json();
            return [id, u];
          })
        );

        const next = {};
        for (const [id, u] of entries) {
          if (u) next[String(id)] = u; // {_id, name, avatarUrl, bio}
        }
        setFollowedUsers(next);
      } catch (e) {
        console.error("load followed users error:", e);
      }
    })();
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

    // ✅ чтобы сразу пропадало имя/аватар
    setFollowedUsers((prev) => {
      const copy = { ...prev };
      delete copy[String(id)];
      return copy;
    });
  }

  function unfollowGame(id) {
    const next = toggleFollowGame(id);
    setGameIds(next);
  }

  // теперь уже можно делать ранние return
  if (status === "loading") {
    return (
      <Page>
        <Title>Following</Title>
        <p>Loading...</p>
      </Page>
    );
  }

  if (!myUserId) {
    return (
      <Page>
        <Title>Following</Title>
        <p>Please sign in to see who you follow (users and games).</p>
      </Page>
    );
  }

  return (
    <Page>
      <Title>Following</Title>

      {/* USERS */}
      <Section>
        <SectionTitle>Users</SectionTitle>

        {userIds.length === 0 && <Muted>No followed users</Muted>}

        <Grid>
          {userIds.map((id) => {
            // ✅ берём реального юзера из API, а localStorage оставили как запасной вариант
            const u = followedUsers[String(id)];
            const p = u || getLocalProfile(id);

            return (
              <ItemCard key={id}>
                <Avatar>
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
                    <AvatarFallback>🙂</AvatarFallback>
                  )}
                </Avatar>

                <ItemMain>
                  <ItemName>{p.name || "User"}</ItemName>
                  <ItemMeta>id: {id}</ItemMeta>
                  <StyledLink href={`/users/${id}`}>Open profile</StyledLink>
                </ItemMain>

                <DangerButton type="button" onClick={() => unfollowUser(id)}>
                  Unfollow
                </DangerButton>
              </ItemCard>
            );
          })}
        </Grid>
      </Section>

      {/* GAMES */}
      <SectionBig>
        <SectionTitle>Games</SectionTitle>

        {gameIds.length === 0 && <Muted>No followed games</Muted>}
        {gameIds.length > 0 && !games && <p>Loading games...</p>}

        <Grid>
          {followedGames.map((g) => (
            <ItemCard key={g._id}>
              <ItemMain>
                <ItemName>{g.title}</ItemName>
                {g.slug ? (
                  <StyledLink href={`/games/${g.slug}`}>Open game</StyledLink>
                ) : (
                  <MutedInline>(no slug)</MutedInline>
                )}
              </ItemMain>

              <DangerButton type="button" onClick={() => unfollowGame(g._id)}>
                Unfollow
              </DangerButton>
            </ItemCard>
          ))}
        </Grid>
      </SectionBig>
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
  --color-border-strong: #d1d5db;

  --color-primary: #4f46e5;
  --color-primary-hover: #4338ca;

  --color-danger: #dc2626;
  --color-danger-hover: #b91c1c;

  --font-sm: 12px;
  --font-md: 14px;
  --font-lg: 22px;

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
  background: transparent;

  p {
    margin: var(--space-sm) 0 0;
    font-size: var(--font-md);
    line-height: 1.4;
  }

  @media (min-width: 768px) {
    padding: 18px;
  }
`;

const Title = styled.h1`
  margin: 0 auto var(--space-2xl);
  font-size: 28px;
  line-height: 1.15;
  text-align: center;

  /* shared content width */
  max-width: 720px;
`;

const Section = styled.div`
  /* center the whole block */
  max-width: 720px;
  margin: 0 auto;

  /* more air between title and content */
  padding-bottom: var(--space-2xl);
`;

const SectionBig = styled.div`
  max-width: 720px;
  margin: 0 auto;

  /* extra space between Users and Games blocks */
  padding-top: var(--space-xl);
  padding-bottom: var(--space-2xl);
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  line-height: 1.2;

  /* center heading */
  text-align: center;

  /* space between heading and grid */
  padding-bottom: var(--space-lg);
`;

const Muted = styled.p`
  opacity: 0.75;
  color: var(--color-muted);
  text-align: center;
`;

const MutedInline = styled.span`
  opacity: 0.75;
  color: var(--color-muted);
`;

const Grid = styled.div`
  display: grid;
  gap: var(--space-md);

  @media (min-width: 768px) {
    gap: var(--space-md);
  }
`;

const ItemCard = styled.div`
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);

  display: flex;
  gap: var(--space-md);
  align-items: center;

  /* ensure card fills the column nicely */
  width: 100%;

  @media (max-width: 520px) {
    padding: var(--space-md);
  }
`;

const Avatar = styled.div`
  width: 44px;
  height: 44px;
  border-radius: var(--radius-pill);
  overflow: hidden;
  background: var(--color-border);
  flex-shrink: 0;
  display: block;
`;

const AvatarFallback = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  opacity: 0.65;
  font-size: 18px;
`;

const ItemMain = styled.div`
  flex: 1;
  min-width: 0;
`;

const ItemName = styled.div`
  font-weight: 800;
  font-size: var(--font-md);
  margin-bottom: var(--space-2xs);
`;

const ItemMeta = styled.div`
  font-size: var(--font-sm);
  color: var(--color-muted);
  opacity: 0.9;
  margin-bottom: var(--space-xs);
`;

const StyledLink = styled(Link)`
  display: inline-block;
  font-size: var(--font-md);
  color: var(--color-primary);
  text-decoration: none;

  &:hover {
    color: var(--color-primary-hover);
    text-decoration: underline;
  }
`;

const DangerButton = styled.button`
  appearance: none;
  border: 1px solid rgba(220, 38, 38, 0.25);
  background: rgba(220, 38, 38, 0.08);
  color: var(--color-danger);
  font-weight: 700;
  font-size: var(--font-md);

  padding: 9px 12px;
  border-radius: var(--radius-pill);
  cursor: pointer;
  white-space: nowrap;

  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;

  &:hover {
    background: rgba(220, 38, 38, 0.14);
    border-color: rgba(220, 38, 38, 0.35);
    color: var(--color-danger-hover);
  }

  @media (max-width: 520px) {
    padding: 8px 10px;
  }
`;
