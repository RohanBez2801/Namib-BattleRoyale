/**
 * Players routes — profiles, stats, match history.
 * All endpoints accept an NBR-Profile-Id header (UUID) to identify
 * the caller without requiring Supabase JWT verification on the server.
 * In a production build this header would be validated with a JWT.
 */
import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  profilesTable,
  playerStatsTable,
  matchHistoryTable,
  insertProfileSchema,
  insertMatchHistorySchema,
} from "@workspace/db/schema";

const router = Router();

// ── GET /api/players/profile ──────────────────────────────────────────────────
// Returns the caller's profile + stats. Creates a new record if none exists.
router.get("/profile", async (req, res) => {
  const profileId = req.headers["nbr-profile-id"] as string | undefined;
  const supabaseId = req.headers["nbr-supabase-id"] as string | undefined;
  const username = (req.headers["nbr-username"] as string | undefined) ?? "Player";

  if (!profileId && !supabaseId) {
    return res.status(400).json({ error: "nbr-profile-id or nbr-supabase-id header required" });
  }

  // Look up by supabase id first, then by profile id
  const existing = supabaseId
    ? await db.query.profilesTable.findFirst({ where: eq(profilesTable.supabaseId, supabaseId) })
    : profileId
    ? await db.query.profilesTable.findFirst({ where: eq(profilesTable.id, profileId) })
    : null;

  if (existing) {
    const stats = await db.query.playerStatsTable.findFirst({
      where: eq(playerStatsTable.profileId, existing.id),
    });
    return res.json({ profile: existing, stats: stats ?? null });
  }

  // Create new profile
  const [newProfile] = await db
    .insert(profilesTable)
    .values({
      supabaseId: supabaseId ?? null,
      username,
      email: req.headers["nbr-email"] as string | undefined ?? null,
    })
    .returning();

  const [newStats] = await db
    .insert(playerStatsTable)
    .values({ profileId: newProfile.id })
    .returning();

  return res.status(201).json({ profile: newProfile, stats: newStats });
});

// ── PATCH /api/players/profile ────────────────────────────────────────────────
router.patch("/profile", async (req, res) => {
  const profileId = req.headers["nbr-profile-id"] as string | undefined;
  if (!profileId) return res.status(400).json({ error: "nbr-profile-id header required" });

  const allowed = ["username", "faction", "outfitColor"] as const;
  const updates: Partial<typeof profilesTable.$inferInsert> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) (updates as Record<string, unknown>)[key] = req.body[key];
  }
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No valid fields to update" });

  const [updated] = await db
    .update(profilesTable)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(profilesTable.id, profileId))
    .returning();

  return res.json({ profile: updated });
});

// ── GET /api/players/match-history ────────────────────────────────────────────
router.get("/match-history", async (req, res) => {
  const profileId = req.headers["nbr-profile-id"] as string | undefined;
  if (!profileId) return res.status(400).json({ error: "nbr-profile-id header required" });

  const limit = Math.min(parseInt(req.query.limit as string ?? "20"), 50);
  const matches = await db.query.matchHistoryTable.findMany({
    where: eq(matchHistoryTable.profileId, profileId),
    orderBy: [desc(matchHistoryTable.playedAt)],
    limit,
  });

  return res.json({ matches });
});

// ── POST /api/players/match-history ───────────────────────────────────────────
// Called after a match ends to record the result and update stats.
router.post("/match-history", async (req, res) => {
  const profileId = req.headers["nbr-profile-id"] as string | undefined;
  if (!profileId) return res.status(400).json({ error: "nbr-profile-id header required" });

  const parsed = insertMatchHistorySchema.safeParse({ ...req.body, profileId });
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const [match] = await db.insert(matchHistoryTable).values(parsed.data).returning();

  // Recalculate aggregate stats
  const allMatches = await db.query.matchHistoryTable.findMany({
    where: eq(matchHistoryTable.profileId, profileId),
  });

  const totalMatches = allMatches.length;
  const wins = allMatches.filter((m) => m.placement === 1).length;
  const kills = allMatches.reduce((s, m) => s + m.kills, 0);
  const deaths = allMatches.filter((m) => m.placement !== 1).length;
  const topTen = allMatches.filter((m) => m.placement <= 10).length;
  const bestPlacement = allMatches.reduce(
    (best, m) => (m.placement < best || best === 0 ? m.placement : best),
    0
  );
  const avgSurvivalMinutes =
    allMatches.reduce((s, m) => s + m.survivalMinutes, 0) / totalMatches;

  // XP & coins
  const xpEarned = parsed.data.xpEarned ?? 0;
  const coinsEarned = parsed.data.coinsEarned ?? 0;

  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, profileId));

  const newXp = (profile?.xp ?? 0) + xpEarned;
  const xpToNext = (profile?.xpToNextLevel ?? 1000);
  let newLevel = profile?.level ?? 1;
  let remainingXp = newXp;
  while (remainingXp >= xpToNext) {
    remainingXp -= xpToNext;
    newLevel++;
  }

  await Promise.all([
    db
      .update(playerStatsTable)
      .set({ totalMatches, wins, kills, deaths, topTen, bestPlacement, avgSurvivalMinutes, updatedAt: new Date() })
      .where(eq(playerStatsTable.profileId, profileId)),
    db
      .update(profilesTable)
      .set({
        xp: remainingXp,
        level: newLevel,
        coins: (profile?.coins ?? 0) + coinsEarned,
        updatedAt: new Date(),
      })
      .where(eq(profilesTable.id, profileId)),
  ]);

  const updatedStats = await db.query.playerStatsTable.findFirst({
    where: eq(playerStatsTable.profileId, profileId),
  });
  const updatedProfile = await db.query.profilesTable.findFirst({
    where: eq(profilesTable.id, profileId),
  });

  return res.status(201).json({ match, stats: updatedStats, profile: updatedProfile });
});

export default router;
