import { useRouter } from "next/router";
import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import styled from "styled-components";

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function GameMediaPage() {
  const { slug } = useRouter().query;

  const {
    data: game,
    error,
    isLoading,
  } = useSWR(slug ? `/api/games/${slug}/media` : null, fetcher);

  if (!slug || isLoading) return <p>Loading...</p>;
  if (error || game?.error) return <p>Failed to load media</p>;

  const screenshots = game?.screenshots || []; // we need "?" to be sure that "game" is not undifined in our case
  const videos = game?.videos || [];

  return (
    <Page>
      <Link href={`/games/${slug}`}>← Back to game</Link>

      <h1>Photos & Videos</h1>

      <h2>Screenshots ({screenshots.length})</h2>
      {screenshots.length === 0 ? (
        <p>No screenshots found</p>
      ) : (
        <Grid>
          {screenshots.map((src, i) => (
            <ImgWrap key={src + i}>
              <Image src={src} alt="" fill style={{ objectFit: "cover" }} />
            </ImgWrap>
          ))}
        </Grid>
      )}

      <h2 style={{ marginTop: 24 }}>Videos ({videos.length})</h2>
      {videos.length === 0 ? (
        <p>No videos found</p>
      ) : (
        <VideoList>
          {videos.map((v) => (
            <li key={v.url}>
              <a href={v.url} target="_blank" rel="noreferrer">
                {v.name || "Video"}
              </a>
            </li>
          ))}
        </VideoList>
      )}
    </Page>
  );
}

const Page = styled.main`
  padding: 16px;
`;

const Grid = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  margin-top: 12px;
`;

const ImgWrap = styled.div`
  position: relative;
  width: 100%;
  height: 140px;
  border-radius: 8px;
  overflow: hidden;
`;

const VideoList = styled.ul`
  margin-top: 12px;
  padding-left: 18px;
`;
