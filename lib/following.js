// lib/following.js (server via /api/users/me) -----------------------

export async function getFollowingUsers() {
  const r = await fetch("/api/users/me");
  if (!r.ok) return [];
  const me = await r.json();
  return Array.isArray(me.followingUsers) ? me.followingUsers : [];
}

export async function getFollowingGames() {
  const r = await fetch("/api/users/me");
  if (!r.ok) return [];
  const me = await r.json();
  return Array.isArray(me.followingGames) ? me.followingGames : [];
}

export async function isFollowingUser(userId) {
  const ids = await getFollowingUsers();
  return ids.includes(String(userId));
}

export async function isFollowingGame(gameId) {
  const ids = await getFollowingGames();
  return ids.includes(String(gameId));
}

export async function toggleFollowUser(userId) {
  const r = await fetch("/api/users/me", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "user", id: String(userId) }),
  });
  if (!r.ok) return [];
  const data = await r.json();
  return Array.isArray(data.followingUsers) ? data.followingUsers : [];
}

export async function toggleFollowGame(gameId) {
  const r = await fetch("/api/users/me", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "game", id: String(gameId) }),
  });
  if (!r.ok) return [];
  const data = await r.json();
  return Array.isArray(data.followingGames) ? data.followingGames : [];
}
