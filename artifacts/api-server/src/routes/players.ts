import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { profilesTable, playerStatsTable } from "@workspace/db/schema";
import { authMiddleware, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/profile", authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const isGuest = req.user!.isGuest;

  const existing = isGuest
    ? await db.query.profilesTable.findFirst({ where: eq(profilesTable.id, userId) })
    : await db.query.profilesTable.findFirst({ where: eq(profilesTable.supabaseId, userId) });

  if (existing) {
    const stats = await db.query.playerStatsTable.findFirst({
      where: eq(playerStatsTable.profileId, existing.id),
    });
    return res.json({ profile: existing, stats: stats ?? null });
  }

  const [newProfile] = await db.insert(profilesTable).values({
    supabaseId: isGuest ? null : userId,
    username: "Recruit_" + userId.slice(0, 4),
  }).returning();

  const [newStats] = await db.insert(playerStatsTable).values({ profileId: newProfile.id }).returning();
  return res.status(201).json({ profile: newProfile, stats: newStats });
});

export default router;