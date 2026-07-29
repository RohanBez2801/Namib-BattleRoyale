---
name: NBR milestone state
description: What has been built across M1 and M2, and what M3 needs.
---

# NBR milestone state

## Milestone 1 — App shell (COMPLETE)
- Animated splash → auth check → lobby or login
- Auth screens (login, register, guest mode via AsyncStorage)
- 5 game screens: lobby, character, profile, store, settings
- Matchmaking modal + mode-select screen
- Custom BottomNav (no Expo tab bar)
- Desert Storm dark palette (colors.ts)
- Supabase client in lib/supabase.ts (null when env vars absent)

## Milestone 2 — Backend & persistence (COMPLETE)
- DB schema: profiles, player_stats, match_history (Drizzle + PostgreSQL)
- Schema pushed via `pnpm --filter @workspace/db run push`
- API routes: GET/PATCH /api/players/profile, GET/POST /api/players/match-history
- Auto-creates profile+stats on first GET (idempotent, keyed on supabase_id or profile_id header)
- POST match-history recalculates aggregate stats and awards XP/coins server-side
- GameContext updated: fetches real profile from API, exposes recentMatches + recordMatchResult
- Profile UUID persisted in AsyncStorage (@nbr_profile_id_v1)
- Profile screen shows real stats, match history, dynamic achievements
- API identity: header-based (nbr-profile-id, nbr-supabase-id, nbr-username) — no JWT yet

## Milestone 3 — Real-time match server (TODO)
- Upgrade api-server with ws/socket.io
- Match state machine: Lobby → Countdown → Active → Ended
- Safe zone (circle) shrink schedule
- Basic hit detection (range checks, no physics)
- New match.tsx screen: 2D top-down view, joystick controls, HUD
- Call recordMatchResult() when match ends
