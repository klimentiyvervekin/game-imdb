import { useRouter } from "next/router";
import useSWR from "swr";
import Image from "next/image";
import Link from "next/link";
import styled from "styled-components";
import ReviewSection from "../../components/ReviewSection";
import PostSection from "@/components/PostSection";
import { isFollowingGame, toggleFollowGame } from "@/lib/following";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function GamePage() {
  const router = useRouter();
  const { slug } = router.query;

  const { data: session, status } = useSession();
  const myUserId = session?.user?.dbUserId || null;

  const {
    data: game,
    error,
    isLoading,
  } = useSWR(slug ? `/api/games/${slug}` : null, fetcher);

  const [followedGame, setFollowedGame] = useState(false);

  useEffect(() => {
    if (!game?._id) return;

    (async () => {
      const ok = await isFollowingGame(game._id);
      setFollowedGame(ok);
    })();
  }, [game?._id]);

  function needLogin() {
    alert("Please, register or log in to follow games.");
  }

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Failed to load data</p>;

  if (!game || game.error) return <p>Game not found</p>;

  const year = game.releaseDate
    ? new Date(game.releaseDate).getFullYear()
    : null;

  return (
    <Page>
      <TopBar>
        <Link href="/">← Back</Link>
      </TopBar>

      <Card>
        {game.coverUrl && (
          <Cover>
            <Image src={game.coverUrl} alt={game.title} fill priority />
          </Cover>
        )}

        {/* title + follow button in one row */}
        <TitleRow>
          <Title>{game.title}</Title>

          <FollowButton
            type="button"
            aria-pressed={followedGame}
            onClick={async () => {
              if (status === "loading") return;
              if (!myUserId) return needLogin();

              const nextIds = await toggleFollowGame(game._id);
              setFollowedGame(
                Array.isArray(nextIds) && nextIds.includes(String(game._id))
              );
            }}
          >
            {followedGame ? "Following" : "Follow"}
          </FollowButton>
        </TitleRow>

        <Meta>
          <li>
            <b>Slug:</b> {game.slug}
          </li>
          <li>
            <b>External ID:</b> {game.externalId}
          </li>

          {year && (
            <li>
              <b>Year:</b> {year}
            </li>
          )}
          {game.developer && (
            <li>
              <b>Developer:</b> {game.developer}
            </li>
          )}
          {game.publisher && (
            <li>
              <b>Publisher:</b> {game.publisher}
            </li>
          )}

          {Array.isArray(game.platforms) && game.platforms.length > 0 && (
            <li>
              <b>Platforms:</b> {game.platforms.join(", ")}
            </li>
          )}

          {game.description && (
            <Section>
              <h2>Description</h2>
              <p>{game.description}</p>
            </Section>
          )}

          {typeof game.score === "number" && (
            <li>
              <b>Score:</b> {game.score}
            </li>
          )}

          {Array.isArray(game.stores) && game.stores.length > 0 && (
            <li>
              <b>Available on:</b> {game.stores.join(", ")}
            </li>
          )}
        </Meta>

        <Link href={`/games/${game.slug}/media`}>
          <MediaButton>
            Photos & Videos
            {typeof game.screenshotsCount === "number" &&
              ` (${game.screenshotsCount} photos`}
            {typeof game.videosCount === "number" &&
              `, ${game.videosCount} videos`}
          </MediaButton>
        </Link>
      </Card>

      <Section>
        <ReviewSection gameId={game._id} />
      </Section>
    </Page>
  );
}

const Page = styled.main`
  padding: 16px;
  max-width: 980px;
  margin: 0 auto;

  @media (max-width: 520px) {
    padding: 12px;
  }
`;

const TopBar = styled.div`
  margin-bottom: 12px;

  a {
    display: inline-flex;
    align-items: center;
    gap: 8px;

    padding: 9px 14px;
    border-radius: 999px;

    border: 1px solid rgba(79, 70, 229, 0.25);
    background: rgba(79, 70, 229, 0.08);
    color: #4f46e5;

    font-size: 14px;
    font-weight: 800;
    text-decoration: none;
    white-space: nowrap;

    transition: background 0.15s ease, border-color 0.15s ease, transform 0.12s ease;
  }

  a:hover {
    background: rgba(79, 70, 229, 0.14);
    border-color: rgba(79, 70, 229, 0.38);
    transform: translateY(-1px);
  }

  a:active {
    transform: translateY(0);
  }

  @media (max-width: 520px) {
    a {
      width: 100%;
      justify-content: center;
    }
  }
`;

const Card = styled.article`
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  overflow: hidden;
  padding: 12px;

  @media (max-width: 520px) {
    padding: 10px;
  }
`;

const Cover = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9; /* ключ: всегда одинаковый блок без белых полей */
  border-radius: 10px;
  overflow: hidden;
  background: #11182710;

  margin-bottom: 18px;

  img {
    object-fit: cover; /* всегда без белых полей */
    object-position: center;
  }

  @media (max-width: 520px) {
    aspect-ratio: 4 / 3;
  }
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: space-between;
  margin: 0 0 12px;

  @media (max-width: 520px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }
`;

const Title = styled.h1`
  margin: 0;
  line-height: 1.15;
  font-size: 28px;

  @media (max-width: 520px) {
    font-size: 22px;
  }
`;

const FollowButton = styled.button`
  appearance: none;
  border: 1px solid rgba(79, 70, 229, 0.28);
  background: rgba(79, 70, 229, 0.10);
  color: #4f46e5;
  font-weight: 800;
  font-size: 14px;

  padding: 9px 14px;
  border-radius: 999px;
  cursor: pointer;
  white-space: nowrap;

  transition: background 0.15s ease, border-color 0.15s ease, transform 0.12s ease;

  &:hover {
    background: rgba(79, 70, 229, 0.14);
    border-color: rgba(79, 70, 229, 0.38);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0px);
  }

  /* when already following */
  &[aria-pressed="true"] {
    border-color: rgba(17, 24, 39, 0.18);
    background: rgba(17, 24, 39, 0.06);
    color: #111827;
  }

  &[aria-pressed="true"]:hover {
    background: rgba(17, 24, 39, 0.09);
    border-color: rgba(17, 24, 39, 0.24);
  }
`;

const Meta = styled.ul`
  margin: 0;
  padding-left: 16px;
`;

const Section = styled.section`
  margin-top: 24px;
`;

const MediaButton = styled.button`
  appearance: none;
  margin-top: 18px;

  display: inline-flex;
  align-items: center;
  gap: 8px;

  padding: 10px 16px;
  border-radius: 999px;

  border: 1px solid rgba(79, 70, 229, 0.25);
  background: rgba(79, 70, 229, 0.08);
  color: #4f46e5;

  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;

  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    transform 0.12s ease;

  &:hover {
    background: rgba(79, 70, 229, 0.14);
    border-color: rgba(79, 70, 229, 0.38);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 520px) {
    width: 100%;
    justify-content: center;
  }
`;
