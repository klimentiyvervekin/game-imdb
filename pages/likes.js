// pages/likes.js
import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import styled from "styled-components";
import { Heart } from "lucide-react";

const fetcher = (url) => fetch(url).then((r) => r.json());

// если есть author._id - делаем ссылку, если нет - просто текст (тоже не надо)
function AuthorLink({ author }) {
  if (!author?._id) return <span>{author?.name || "User"}</span>;
  return <Link href={`/users/${author._id}`}>{author.name || "User"}</Link>;
}

export default function LikesPage() {
  const { data: session, status } = useSession();
  const myUserId = session?.user?.dbUserId || null; // mongo user

  const { data, error, mutate } = useSWR(
    status === "authenticated" ? "/api/likes/me" : null,
    fetcher
  );

  if (status === "loading") return <p>Loading...</p>;

  if (!myUserId) {
    return (
      <Page>
        <Title>Liked content</Title>

        <EmptyState>
          <EmptyIcon>🔒</EmptyIcon>
          <EmptyTitle>Please sign in</EmptyTitle>
          <EmptyText>Sign in to see your likes.</EmptyText>
        </EmptyState>
      </Page>
    );
  }

  if (error) return <p>Failed to load likes</p>;
  if (!data) return <p>Loading...</p>;

  const posts = Array.isArray(data.posts) ? data.posts : [];
  const comments = Array.isArray(data.comments) ? data.comments : [];
  const replies = Array.isArray(data.replies) ? data.replies : [];

  async function unlikePost(postId) {
    await fetch(`/api/posts/${postId}/like`, { method: "POST" });
    mutate();
  }

  async function unlikeComment(postId, commentId) {
    await fetch(`/api/posts/${postId}/comments/${commentId}/like`, {
      method: "POST",
    });
    mutate();
  }

  async function unlikeReply(postId, commentId, replyId) {
    await fetch(
      `/api/posts/${postId}/comments/${commentId}/replies/${replyId}/like`,
      { method: "POST" }
    );
    mutate();
  }

  return (
    <Page>
      <Title>Liked content</Title>

      {/* POSTS */}
      <Section>
        <SectionTitle>Posts</SectionTitle>
        {posts.length === 0 && (
        <EmptyBlock>
          <EmptyLabel>No liked posts</EmptyLabel>
        </EmptyBlock>
      )}

        {posts.map((p) => (
          <Card key={p._id}>
            <MetaLine>
              {p.gameId?.slug ? (
                <Link href={`/games/${p.gameId.slug}`}>
                  Open game: {p.gameId.title || p.gameId.slug}
                </Link>
              ) : (
                <span>(no game)</span>
              )}
            </MetaLine>

            <BodyText>{(p.content || "").slice(0, 200)}</BodyText>

            {p.imageUrl && (
              <CardImage src={p.imageUrl} alt="" width={800} height={450} />
            )}

            <Actions>
              <DangerButton type="button" onClick={() => unlikePost(p._id)}>
                Unlike
              </DangerButton>
            </Actions>
          </Card>
        ))}
      </Section>

      {/* COMMENTS */}
      <Section>
        <SectionTitle>Comments</SectionTitle>
                {posts.length === 0 && (
        <EmptyBlock>
          <EmptyLabel>No liked comments</EmptyLabel>
        </EmptyBlock>
      )}

        {comments.map((c) => (
          <Card key={c._id}>
            <MetaLine>
              {c.game?.slug ? (
                <Link href={`/games/${c.game.slug}`}>
                  Open game: {c.game.title || c.game.slug}
                </Link>
              ) : (
                <span>(no game)</span>
              )}
            </MetaLine>

            {/* link */}
            <MetaLine style={{ marginTop: 6 }}>
              Author: <AuthorLink author={c.author} />
            </MetaLine>

            <BodyText>{c.text}</BodyText>

            {c.imageUrl && (
              <CardImage src={c.imageUrl} alt="" width={800} height={450} />
            )}

            <Actions>
              <DangerButton
                type="button"
                onClick={() => unlikeComment(c.postId, c._id)}
              >
                Unlike
              </DangerButton>
            </Actions>
          </Card>
        ))}
      </Section>

      {/* REPLIES */}
      <Section>
        <SectionTitle>Replies</SectionTitle>
                        {posts.length === 0 && (
        <EmptyBlock>
          <EmptyLabel>No liked replies</EmptyLabel>
        </EmptyBlock>
      )}

        {replies.map((r) => (
          <Card key={r._id}>
            <MetaLine>
              {r.game?.slug ? (
                <Link href={`/games/${r.game.slug}`}>
                  Open game: {r.game.title || r.game.slug}
                </Link>
              ) : (
                <span>(no game)</span>
              )}
            </MetaLine>

            {/* link */}
            <MetaLine style={{ marginTop: 6 }}>
              Author: <AuthorLink author={r.author} />
            </MetaLine>

            <BodyText>{r.text}</BodyText>

            {r.imageUrl && (
              <CardImage src={r.imageUrl} alt="" width={800} height={450} />
            )}

            <Actions>
              <DangerButton
                type="button"
                onClick={() => unlikeReply(r.postId, r.commentId, r._id)}
              >
                Unlike
              </DangerButton>
            </Actions>
          </Card>
        ))}
      </Section>
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

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);

  max-width: 900px;
  margin: 0 auto;
  padding: var(--space-lg);
  color: var(--color-text);

  p {
    margin: var(--space-sm) 0 0;
    font-size: var(--font-md);
    line-height: 1.45;
  }

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
`;

const Title = styled.h1`
  margin-top: 0;
  margin-bottom: var(--space-2xl);
  font-size: var(--font-lg);
  line-height: 1.15;
  text-align: center;

  max-width: 720px;
  margin-left: auto;
  margin-right: auto;
`;

const Section = styled.section`
  max-width: 720px;
  margin: var(--space-2xl) auto 0;
  padding-bottom: var(--space-lg);
`;

const SectionTitle = styled.h2`
  margin: 0 auto var(--space-lg);
  font-size: 18px;
  line-height: 1.2;
  text-align: center;
`;

const Card = styled.div`
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: var(--space-md);
  margin-top: 12px;
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);

  /* CENTER the cards (this fixes the "shifted left") */
  max-width: 640px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

const MetaLine = styled.div`
  font-size: var(--font-sm);
  opacity: 0.85;
  color: var(--color-muted);
`;

const BodyText = styled.div`
  margin-top: var(--space-sm);
  font-size: var(--font-md);
  color: var(--color-text);
  line-height: 1.5;
  word-break: break-word;
`;

const CardImage = styled(Image)`
  width: 100%;
  height: auto;

  /* bigger but not giant */
  max-height: 460px;
  max-width: 560px;

  object-fit: contain;
  display: block;

  margin: var(--space-md) auto 0;
  background: rgba(17, 24, 39, 0.04);
  border-radius: var(--radius-sm);
`;

const Actions = styled.div`
  margin-top: var(--space-md);
  display: flex;
  justify-content: flex-start;
`;

const DangerButton = styled.button`
  appearance: none;
  border: 1px solid rgba(220, 38, 38, 0.25);
  background: rgba(220, 38, 38, 0.08);
  color: var(--color-danger);
  font-weight: 700;
  font-size: var(--font-md);

  padding: 9px 12px;
  border-radius: 999px;
  cursor: pointer;
  white-space: nowrap;

  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;

  &:hover {
    background: rgba(220, 38, 38, 0.14);
    border-color: rgba(220, 38, 38, 0.35);
    color: var(--color-danger-hover);
  }
`;

const EmptyState = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-xl);

  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);

  display: grid;
  justify-items: center;
  gap: var(--space-sm);

  text-align: center;
`;

const EmptyIcon = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 999px;
  background: rgba(79, 70, 229, 0.08);
  border: 1px solid rgba(79, 70, 229, 0.18);

  display: grid;
  place-items: center;

  font-size: 18px;
`;

const EmptyTitle = styled.div`
  margin-top: var(--space-xs);
  font-size: 16px;
  font-weight: 900;
  line-height: 1.2;
`;

const EmptyText = styled.p`
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

const EmptyBlock = styled.div`
  margin: 24px auto 0;
  padding: 18px 16px;
  max-width: 520px;

  text-align: center;

  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(17, 24, 39, 0.02);
`;

const EmptyLabel = styled.div`
  font-size: var(--font-md);
  font-weight: 800;
  color: var(--color-text);
`;
