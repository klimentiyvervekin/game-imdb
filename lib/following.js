// lib/following.js

const USERS_KEY = "followingUsers";
const GAMES_KEY = "followingGames";

function safeParse(raw, fallback) {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

export function getFollowingUsers() {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(USERS_KEY), []);
}

export function setFollowingUsers(ids) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USERS_KEY, JSON.stringify(ids));
}

export function isFollowingUser(userId) {
  return getFollowingUsers().includes(String(userId));
}

export function toggleFollowUser(userId) {
  const id = String(userId);
  const list = getFollowingUsers();
  const next = list.includes(id) ? list.filter((x) => x !== id) : [id, ...list];
  setFollowingUsers(next);
  return next;
}

export function getFollowingGames() {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(GAMES_KEY), []);
}

export function setFollowingGames(ids) {
  if (typeof window === "undefined") return;
  localStorage.setItem(GAMES_KEY, JSON.stringify(ids));
}

export function isFollowingGame(gameId) {
  return getFollowingGames().includes(String(gameId));
}

export function toggleFollowGame(gameId) {
  const id = String(gameId);
  const list = getFollowingGames();
  const next = list.includes(id) ? list.filter((x) => x !== id) : [id, ...list];
  setFollowingGames(next);
  return next;
}
