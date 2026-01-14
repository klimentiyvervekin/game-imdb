import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import styled from "styled-components";

export default function SearchBar() {
  const { data: session, status } = useSession();
  const myUserId = session?.user?.dbUserId || null;

  const [q, setQ] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function search(e) {
    e.preventDefault();
    setErr("");

    if (status === "loading") return;
    if (!myUserId) {
      setErr("Please, log in to use search.");
      return;
    }

    const query = q.trim();
    if (!query) {
      setData(null);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (!res.ok) {
        setErr(json?.error || "Search failed");
        setData(null);
        return;
      }
      setData(json);
    } catch (e2) {
      setErr(e2.message || "Search failed");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  const users = Array.isArray(data?.users) ? data.users : [];
  const games = Array.isArray(data?.games) ? data.games : [];

  return (
    <Wrap>
      <Form onSubmit={search}>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search games or users..."
        />
        <SearchButton type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </SearchButton>
      </Form>

      {err && <ErrorText>{err}</ErrorText>}

      {data && (
        <Results>
          <Section>
            <strong>Users</strong>
            {users.length === 0 ? (
              <Empty>No users found</Empty>
            ) : (
              <Links>
                {users.map((u) => (
                  <Link key={u._id} href={`/users/${u._id}`}>
                    {u.name}
                  </Link>
                ))}
              </Links>
            )}
          </Section>

          <Section>
            <strong>Games</strong>
            {games.length === 0 ? (
              <Empty>No games found</Empty>
            ) : (
              <Links>
                {games.map((g) => (
                  <Link key={g.id} href={`/games/${g.slug}`}>
                    {g.name}
                  </Link>
                ))}
              </Links>
            )}
          </Section>
        </Results>
      )}
    </Wrap>
  );
}

/* ===================== styles ===================== */

const Wrap = styled.div`
  --color-bg: #ffffff;
  --color-text: #111827;
  --color-muted: #6b7280;
  --color-border: #e5e7eb;
  --color-border-strong: #d1d5db;

  --color-primary: #4f46e5;
  --color-primary-hover: #4338ca;

  --color-danger: #dc2626;

  --font-sm: 12px;
  --font-md: 14px;

  --space-xs: 6px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-pill: 999px;

  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  background: var(--color-bg);
`;

const Form = styled.form`
  display: flex;
  gap: var(--space-sm);
  align-items: center;

  @media (max-width: 520px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const Input = styled.input`
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  font-size: var(--font-md);
  outline: none;

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
  }
`;

const SearchButton = styled.button`
  appearance: none;
  border: 1px solid transparent;
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
  font-size: var(--font-md);
  padding: 10px 14px;
  border-radius: var(--radius-pill);
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: var(--color-primary-hover);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 520px) {
    width: 100%;
  }
`;

const ErrorText = styled.p`
  margin-top: var(--space-sm);
  color: var(--color-danger);
  font-size: var(--font-md);
`;

const Results = styled.div`
  margin-top: var(--space-lg);
  display: grid;
  gap: var(--space-lg);
`;

const Section = styled.div`
  strong {
    display: block;
    margin-bottom: var(--space-xs);
    font-size: var(--font-md);
  }
`;

const Empty = styled.div`
  opacity: 0.7;
  margin-top: var(--space-xs);
  font-size: var(--font-md);
  color: var(--color-muted);
`;

const Links = styled.div`
  margin-top: var(--space-sm);
  display: grid;
  gap: var(--space-xs);

  a {
    text-decoration: none;
    color: var(--color-text);
    font-size: var(--font-md);
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: #fff;
  }

  a:hover {
    border-color: var(--color-primary);
  }
`;
