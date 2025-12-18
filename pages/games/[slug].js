import { useRouter } from "next/router";
import useSWR from "swr";
import Image from "next/image";
import Link from "next/link";
import styled from "styled-components";

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function GamePage() {
  const router = useRouter();
  const { slug } = router.query;

  const { data: game, error, isLoading } = useSWR(
    slug ? `/api/games/${slug}` : null,
    fetcher
  );

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Failed to load data</p>;

  if (!game || game.error) return <p>Game not found</p>;

  return (
    <Page>
      <TopBar>
        <Link href="/">← Back</Link>
      </TopBar>

      <Card>
        {game.coverUrl && (
          <Cover>
            <Image
              src={game.coverUrl}
              alt={game.title}
              width={800}
              height={450}
              style={{ objectFit: "cover" }}
            />
          </Cover>
        )}

        <Title>{game.title}</Title>

        <Meta>
          <li>
            <b>Slug:</b> {game.slug}
          </li>
          <li>
            <b>External ID:</b> {game.externalId}
          </li>
        </Meta>
      </Card>

      <Section>
        <h2>Posts</h2>
        <p>No posts yet</p>
      </Section>
    </Page>
  );
}

const Page = styled.main`
  padding: 16px;
  max-width: 980px;
  margin: 0 auto;
`;

const TopBar = styled.div`
  margin-bottom: 12px;
`;

const Card = styled.article`
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  overflow: hidden;
  padding: 12px;
`;

const Cover = styled.div`
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
`;

const Title = styled.h1`
  margin: 0 0 12px 0;
`;

const Meta = styled.ul`
  margin: 0;
  padding-left: 16px;
`;

const Section = styled.section`
  margin-top: 24px;
`;
