/**
 * NBR API client — thin fetch wrapper for the api-server.
 *
 * The API server runs at /api relative to the Replit dev domain.
 * All player endpoints use header-based identity (no JWT required for M2).
 */

// API server is routed at /api on the same Replit dev domain.
// In production it maps to the same autoscale deployment.
const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
    : "http://localhost:8080/api");

export interface NBRProfile {
  id: string;
  supabaseId: string | null;
  username: string;
  email: string | null;
  level: number;
  xp: number;
  xpToNextLevel: number;
  coins: number;
  premiumCurrency: number;
  faction: string | null;
  outfitColor: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NBRPlayerStats {
  id: string;
  profileId: string;
  totalMatches: number;
  wins: number;
  kills: number;
  deaths: number;
  topTen: number;
  bestPlacement: number;
  avgSurvivalMinutes: number;
}

export interface NBRMatchHistory {
  id: string;
  profileId: string;
  matchId: string;
  mode: string;
  placement: number;
  kills: number;
  damageDealt: number;
  survivalMinutes: number;
  coinsEarned: number;
  xpEarned: number;
  playedAt: string;
}

interface ProfileResponse {
  profile: NBRProfile;
  stats: NBRPlayerStats | null;
}

interface MatchHistoryResponse {
  matches: NBRMatchHistory[];
}

interface PostMatchResponse {
  match: NBRMatchHistory;
  stats: NBRPlayerStats;
  profile: NBRProfile;
}

function makeHeaders(identity: PlayerIdentity): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (identity.profileId) h["nbr-profile-id"] = identity.profileId;
  if (identity.supabaseId) h["nbr-supabase-id"] = identity.supabaseId;
  if (identity.username) h["nbr-username"] = identity.username;
  if (identity.email) h["nbr-email"] = identity.email;
  return h;
}

export interface PlayerIdentity {
  profileId?: string;
  supabaseId?: string;
  username?: string;
  email?: string;
}

async function request<T>(
  path: string,
  options: RequestInit & { identity: PlayerIdentity }
): Promise<T> {
  const { identity, ...rest } = options;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: { ...makeHeaders(identity), ...(rest.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`NBR API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export const nbrApi = {
  /** Fetch (or auto-create) profile + stats for the current player. */
  getProfile(identity: PlayerIdentity): Promise<ProfileResponse> {
    return request<ProfileResponse>("/players/profile", {
      method: "GET",
      identity,
    });
  },

  /** Update mutable profile fields. */
  updateProfile(
    identity: PlayerIdentity,
    patch: Partial<Pick<NBRProfile, "username" | "faction" | "outfitColor">>
  ): Promise<{ profile: NBRProfile }> {
    return request("/players/profile", {
      method: "PATCH",
      identity,
      body: JSON.stringify(patch),
    });
  },

  /** Fetch recent match history. */
  getMatchHistory(
    identity: PlayerIdentity,
    limit = 20
  ): Promise<MatchHistoryResponse> {
    return request<MatchHistoryResponse>(
      `/players/match-history?limit=${limit}`,
      { method: "GET", identity }
    );
  },

  /** Record a match result (called when a match ends). */
  recordMatch(
    identity: PlayerIdentity,
    result: {
      matchId: string;
      mode: string;
      placement: number;
      kills?: number;
      damageDealt?: number;
      survivalMinutes?: number;
      coinsEarned?: number;
      xpEarned?: number;
    }
  ): Promise<PostMatchResponse> {
    return request<PostMatchResponse>("/players/match-history", {
      method: "POST",
      identity,
      body: JSON.stringify(result),
    });
  },
};
