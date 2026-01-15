// components/NavBar.js
import Link from "next/link";
import Image from "next/image";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import styled, { css } from "styled-components";

export default function NavBar() {
  const { data: session } = useSession();
  const router = useRouter();

  const myUserId = session?.user?.dbUserId || null;

  const isActive = (path) => {
    if (path === "/users" && router.pathname.startsWith("/users")) return true;
    return router.pathname === path;
  }; // keeps the Users link active on all /users pages

  return (
    <NavWrap>
      <Left>
        <LogoLink href="/" aria-label="Home">
          <Image src="/logo.png" alt="Logo" width={39} height={39} />
        </LogoLink>

        <NavCenter>
          <NavLink href="/" $active={isActive("/")}>
            Home
          </NavLink>

          {/*  show Profile only when logged in */}
          {myUserId && (
            <NavLink
              href={`/users/${myUserId}`}
              $active={router.pathname.startsWith("/users")}
            >
              Profile
            </NavLink>
          )}

          <NavLink href="/bookmarks" $active={isActive("/bookmarks")}>
            Following
          </NavLink>

          <NavLink href="/likes" $active={isActive("/likes")}>
            Likes
          </NavLink>
        </NavCenter>
      </Left>

      <Right>
        {session?.user ? (
          <>
            <EmailText>{session.user.email}</EmailText>
            <ActionButton type="button" onClick={() => signOut()}>
              Logout
            </ActionButton>
          </>
        ) : (
          <PrimaryButton type="button" onClick={() => signIn("google")}>
            Login with Google
          </PrimaryButton>
        )}
      </Right>
    </NavWrap>
  );
}

/* ===================== styles ===================== */

const NavWrap = styled.nav`
  --color-bg: #ffffff;
  --color-text: #111827;
  --color-muted: #6b7280;
  --color-border: #e5e7eb;

  --color-primary: #4f46e5;
  --color-primary-soft: rgba(79, 70, 229, 0.12);

  position: sticky;
  top: 0;
  z-index: 30;

  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);

  padding: 14px 20px;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  @media (max-width: 640px) {
    padding: 10px 12px;
    gap: 8px;
  }
`;


const Left = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0; /*  важно чтобы NavCenter мог сжиматься */
`;


const LogoLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 44px;
  height: 44px;

  border-radius: 12px;
  text-decoration: none;

  &:hover {
    background: rgba(17, 24, 39, 0.06);
  }

  img {
    display: block;
  }

  @media (max-width: 640px) {
    width: 34px;
    height: 34px;
  }
`;

const NavCenter = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;

  flex-wrap: nowrap;            /* ✅ не переносить */
  overflow-x: auto;             /* ✅ если не влазит — скролл */
  -webkit-overflow-scrolling: touch;

  /* убрать полоску скролла */
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 640px) {
    gap: 6px;
  }
`;

const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0; /* ✅ чтобы Logout/Login не ужимался в ноль */

  @media (max-width: 640px) {
    gap: 6px;
  }
`;



const activeStyles = css`
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 700;
`;

const NavLink = styled(Link)`
  text-decoration: none;
  color: var(--color-text);
  font-size: 14px;

  padding: 7px 14px;
  border-radius: 999px;

  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: rgba(17, 24, 39, 0.06);
  }

  ${({ $active }) => $active && activeStyles}

  white-space: nowrap; /* ✅ важно */

  @media (max-width: 640px) {
    padding: 6px 10px;
    font-size: 12px;
  }
`;


const EmailText = styled.span`
  font-size: 12px;
  color: var(--color-muted);
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 640px) {
    display: none;
  }
`;

const BaseButton = styled.button`
  appearance: none;
  border: 1px solid var(--color-border);
  background: #f3f4f6;
  color: var(--color-text);
  font-size: 14px;
  font-weight: 600;

  padding: 7px 14px;
  border-radius: 999px;
  cursor: pointer;

  &:hover {
    background: #e5e7eb;
  }

  white-space: nowrap;

  @media (max-width: 640px) {
    padding: 6px 10px;
    font-size: 12px;
  }
`;


const PrimaryButton = styled(BaseButton)`
  background: var(--color-primary);
  color: #fff;
  border-color: transparent;

  &:hover {
    background: #4338ca;
  }
`;

const ActionButton = styled(BaseButton)``;
