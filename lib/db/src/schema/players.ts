import { pgTable, text, integer, real, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ─── Profiles ────────────────────────────────────────────────────────────────
export const profilesTable = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  supabaseId: text("supabase_id").unique(), // null for guest profiles
  username: text("username").notNull(),
  email: text("email"),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  xpToNextLevel: integer("xp_to_next_level").notNull().default(1000),
  coins: integer("coins").notNull().default(500),
  premiumCurrency: integer("premium_currency").notNull().default(0),
  faction: text("faction").default("Himba"), // chosen faction/community
  outfitColor: text("outfit_color").default("#FF6B1A"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profilesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectProfileSchema = createSelectSchema(profilesTable);

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profilesTable.$inferSelect;

// ─── Player Stats ─────────────────────────────────────────────────────────────
export const playerStatsTable = pgTable("player_stats", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profilesTable.id, { onDelete: "cascade" }),
  totalMatches: integer("total_matches").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  kills: integer("kills").notNull().default(0),
  deaths: integer("deaths").notNull().default(0),
  topTen: integer("top_ten").notNull().default(0),
  bestPlacement: integer("best_placement").notNull().default(0),
  avgSurvivalMinutes: real("avg_survival_minutes").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPlayerStatsSchema = createInsertSchema(playerStatsTable).omit({
  id: true,
  updatedAt: true,
});
export const selectPlayerStatsSchema = createSelectSchema(playerStatsTable);

export type InsertPlayerStats = z.infer<typeof insertPlayerStatsSchema>;
export type PlayerStats = typeof playerStatsTable.$inferSelect;

// ─── Match History ────────────────────────────────────────────────────────────
export const matchHistoryTable = pgTable("match_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profilesTable.id, { onDelete: "cascade" }),
  matchId: text("match_id").notNull(),
  mode: text("mode").notNull(), // training | solo | duo | squad
  placement: integer("placement").notNull(),
  kills: integer("kills").notNull().default(0),
  damageDealt: integer("damage_dealt").notNull().default(0),
  survivalMinutes: real("survival_minutes").notNull().default(0),
  coinsEarned: integer("coins_earned").notNull().default(0),
  xpEarned: integer("xp_earned").notNull().default(0),
  playedAt: timestamp("played_at").notNull().defaultNow(),
});

export const insertMatchHistorySchema = createInsertSchema(matchHistoryTable).omit({
  id: true,
  playedAt: true,
});
export const selectMatchHistorySchema = createSelectSchema(matchHistoryTable);

export type InsertMatchHistory = z.infer<typeof insertMatchHistorySchema>;
export type MatchHistory = typeof matchHistoryTable.$inferSelect;
