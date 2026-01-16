// pages/games/[slug]/media.js
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import styled from "styled-components";

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function GameMediaPage() {
  const { slug } = useRouter().query;

  const [activeImage, setActiveImage] = useState(null);

  const {
    data: game,
    error,
    isLoading,
  } = useSWR(slug ? `/api/games/${slug}/media` : null, fetcher);

  // close on ESC
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") setActiveImage(null);
    }
    if (activeImage) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeImage]);

  if (!slug || isLoading) return <p>Loading...</p>;
  if (error || game?.error) return <p>Failed to load media</p>;

  const screenshots = game?.screenshots || [];
  const videos = game?.videos || [];

  return (
    <Page>
      <TopBar>
        <BackLink href={`/games/${slug}`}>← Back to game</BackLink>
      </TopBar>

      <Title>Photos & Videos</Title>

      <Section>
        <SectionTitle>Screenshots ({screenshots.length})</SectionTitle>

        {screenshots.length === 0 ? (
          <Muted>No screenshots found</Muted>
        ) : (
          <Grid>
            {screenshots.map((src, i) => (
              <Card key={src + i} type="button" onClick={() => setActiveImage(src)}>
                <ImgWrap>
                  <Image src={src} alt="" fill style={{ objectFit: "cover" }} />
                </ImgWrap>
              </Card>
            ))}
          </Grid>
        )}
      </Section>

      <Section style={{ marginTop: 28 }}>
        <SectionTitle>Videos ({videos.length})</SectionTitle>

        {videos.length === 0 ? (
          <Muted>No videos found</Muted>
        ) : (
          <VideoList>
            {videos.map((v) => (
              <li key={v.url}>
                <VideoLink href={v.url} target="_blank" rel="noreferrer">
                  {v.name || "Video"}
                </VideoLink>
              </li>
            ))}
          </VideoList>
        )}
      </Section>

      {activeImage && (
        <Lightbox
          role="button"
          aria-label="Close preview"
          onClick={() => setActiveImage(null)}
        >
          <LightboxInner onClick={(e) => e.stopPropagation()}>
            <LightboxImage src={activeImage} alt="" width={1600} height={900} />
            <Hint>Click outside (or press Esc) to close</Hint>
          </LightboxInner>
        </Lightbox>
      )}
    </Page>
  );
}

/* ===================== styles ===================== */

const Page = styled.main`
  --color-bg: #ffffff;
  --color-surface: #ffffff;
  --color-text: #111827;
  --color-muted: #6b7280;
  --color-border: #e5e7eb;

  --color-primary: #4f46e5;
  --color-primary-hover: #4338ca;

  --radius-sm: 8px;
  --radius-md: 12px;

  --space-xs: 6px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 24px;

  max-width: 980px;
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
`;

const TopBar = styled.div`
  max-width: 820px;
  margin: 0 auto var(--space-md);
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);

  &:hover {
    background: rgba(17, 24, 39, 0.04);
    text-decoration: none;
  }
`;

const Title = styled.h1`
  max-width: 820px;
  margin: 0 auto var(--space-xl);
  text-align: center;
  font-size: 28px;
  line-height: 1.12;
`;

const Section = styled.section`
  max-width: 820px;
  margin: 0 auto;
`;

const SectionTitle = styled.h2`
  margin: 0 0 var(--space-md);
  text-align: center;
  font-size: 18px;
  line-height: 1.2;
`;

const Muted = styled.p`
  margin: 0;
  text-align: center;
  color: var(--color-muted);
  opacity: 0.9;
`;

const Grid = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
`;

const Card = styled.button`
  appearance: none;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: 0;
  overflow: hidden;
  cursor: zoom-in;

  transition: transform 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(79, 70, 229, 0.25);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  }

  &:focus-visible {
    outline: 2px solid rgba(79, 70, 229, 0.35);
    outline-offset: 2px;
  }
`;

const ImgWrap = styled.div`
  position: relative;
  width: 100%;
  height: 140px;
  background: rgba(17, 24, 39, 0.04);

  @media (min-width: 768px) {
    height: 150px;
  }
`;

const VideoList = styled.ul`
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 8px;
`;

const VideoLink = styled.a`
  display: inline-block;
`;

const Lightbox = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;

  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;

  padding: 18px;
  cursor: zoom-out;
`;

const LightboxInner = styled.div`
  max-width: min(1100px, 100%);
  max-height: min(90vh, 100%);
  display: grid;
  gap: 10px;
  justify-items: center;
`;

const LightboxImage = styled(Image)`
  max-width: 100%;
  max-height: 80vh;
  width: auto;
  height: auto;

  border-radius: 12px;
  background: #000;
  cursor: default;
`;

const Hint = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
`;
