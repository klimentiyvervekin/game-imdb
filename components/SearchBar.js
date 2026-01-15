import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import styled from "styled-components";

export default function SearchBar() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.dbUserId || null;

  const [searchResponse, setSearchResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  async function handleSearchSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    if (!currentUserId) {
      setErrorMessage("Please log in to use search.");
      return;
    }

    const formData = new FormData(event.target);
    const searchQuery = String(formData.get("filter") || "").trim();

    if (!searchQuery) {
      setSearchResponse(null);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}`
      );
      const responseData = await response.json();

      if (!response.ok) {
        setErrorMessage(responseData?.error || "Search failed");
        setSearchResponse(null);
        return;
      }

      setSearchResponse(responseData);
      event.target.reset();
    } catch (error) {
      setErrorMessage(error.message || "Search failed");
      setSearchResponse(null);
    } finally {
      setIsLoading(false);
    }
  }

  const foundUsers = Array.isArray(searchResponse?.users)
    ? searchResponse.users
    : [];

  const foundGames = Array.isArray(searchResponse?.games)
    ? searchResponse.games
    : [];

  return (
    <Wrap>
      <Form onSubmit={handleSearchSubmit}>
        <Input
          name="filter"
          placeholder="Search games or users..."
          autoComplete="off"
        />
        <SearchButton type="submit" disabled={isLoading}>
          {isLoading ? "Searching..." : "Search"}
        </SearchButton>
      </Form>

      {errorMessage && <ErrorText>{errorMessage}</ErrorText>}

      {hasSearched && (
        <Results>
          <Section>
            <strong>Users</strong>
            {foundUsers.length === 0 ? (
              <Empty>No users found</Empty>
            ) : (
              <Links>
                {foundUsers.map((user) => (
                  <Link key={user._id} href={`/users/${user._id}`}>
                    {user.name}
                  </Link>
                ))}
              </Links>
            )}
          </Section>

          <Section>
            <strong>Games</strong>
            {foundGames.length === 0 ? (
              <Empty>No games found</Empty>
            ) : (
              <Links>
                {foundGames.map((game) => (
                  <Link key={game.slug} href={`/games/${game.slug}`}>
                    {game.name}
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
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  background: #fff;
`;

const Form = styled.form`
  display: flex;
  gap: 8px;
  align-items: center;

  @media (max-width: 520px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const Input = styled.input`
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  outline: none;

  &:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
  }
`;

const SearchButton = styled.button`
  border: 1px solid transparent;
  background: #4f46e5;
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  padding: 10px 14px;
  border-radius: 999px;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: #4338ca;
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
  margin-top: 8px;
  color: #dc2626;
  font-size: 14px;
`;

const Results = styled.div`
  margin-top: 16px;
  display: grid;
  gap: 16px;
`;

const Section = styled.div`
  strong {
    display: block;
    margin-bottom: 6px;
    font-size: 14px;
  }
`;

const Empty = styled.div`
  opacity: 0.7;
  margin-top: 6px;
  font-size: 14px;
  color: #6b7280;
`;

const Links = styled.div`
  margin-top: 8px;
  display: grid;
  gap: 6px;

  a {
    text-decoration: none;
    color: #111827;
    font-size: 14px;
    padding: 6px 8px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    background: #fff;
  }

  a:hover {
    border-color: #4f46e5;
  }
`;
