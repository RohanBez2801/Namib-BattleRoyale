import { createServer } from "http";
import { Server, Socket } from "socket.io";
import app from "./app";
import { logger } from "./lib/logger";

/**
 * ============================================================
 * NAMIB BATTLE ROYALE - AUTHORITATIVE ENGINE v1.1.0
 * ============================================================
 * Developed as the Source of Truth for Mobile and UE5 Clients.
 */

const port = Number(process.env["PORT"] || "5000");
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// ============================================================
// 1. ENGINE CONSTANTS & BALANCE DATA
// ============================================================
const MAP_SIZE = 5000;
const TICK_RATE = 50; // 20Hz
const MAX_SLOTS = 5;
const OVERSHIELD_MAX = 50;
const OVERSHIELD_REGEN_DELAY = 5000;
const BUS_DURATION = 20000; 
const DROP_ALTITUDE = 1000;
const MATCH_RESET_DELAY = 15000;
const REQUIRED_VERSION = "1.0.0"; // Handshake Requirement

const WEAPONS = [
  { id: 'oryx_striker',         name: 'Oryx Striker',         category: 'ar',      baseDmg: 27, rate: 200, rad: 40 },
  { id: 'welwitschia_blaster',  name: 'Welwitschia Blaster',  category: 'shotgun', baseDmg: 80, rate: 800, rad: 65 },
  { id: 'sand_viper',           name: 'Sand Viper',           category: 'smg',     baseDmg: 19, rate: 100, rad: 35 },
  { id: 'skeleton_coast_rifle', name: 'Skeleton Coast',       category: 'sniper',  baseDmg: 95, rate: 1500,rad: 20 },
  { id: 'bushmans_sidearm',     name: "Bushman's Sidearm",    category: 'pistol',  baseDmg: 24, rate: 350, rad: 45 },
];

const CONSUMABLES = [
  { id: 'mopane_caterpillar', name: 'Mopane Caterpillar', type: 'health', amt: 25, time: 2000 },
  { id: 'elephant_bark_tea',  name: 'Elephant Bark Tea',  type: 'shield', amt: 50, time: 4000 },
  { id: 'namibian_biltong',   name: 'Namibian Biltong',   type: 'health', amt: 75, time: 3500 },
  { id: 'small_shield_pot',   name: 'Small Shield Pot',   type: 'shield', amt: 25, time: 2000 },
];

const STORM_PHASES = [
  { wait: 60000, shrink: 90000, radius: 2000, dps: 1 },
  { wait: 45000, shrink: 75000, radius: 1500, dps: 2 },
  { wait: 30000, shrink: 60000, radius: 1000, dps: 5 },
  { wait: 15000, shrink: 30000, radius: 100,  dps: 15 },
];

const POIs = [
  { name: 'Dune 45', x: 2600, y: 2400 }, { name: 'Skeleton Coast', x: 1500, y: 1500 },
  { name: 'Deadvlei', x: 3500, y: 1200 }, { name: 'Fish River', x: 800, y: 3000 },
  { name: 'Sossusvlei', x: 4200, y: 2800 }, { name: 'Etosha', x: 2000, y: 4200 }
];

const RARITIES = [
  { level: 'common', color: '#9CA3AF', mult: 1.0 },
  { level: 'uncommon', color: '#22C55E', mult: 1.1 },
  { level: 'rare', color: '#3B82F6', mult: 1.2 },
  { level: 'epic', color: '#A855F7', mult: 1.3 },
  { level: 'legendary', color: '#F5A623', mult: 1.45 },
  { level: 'mythic', color: '#FFD700', mult: 1.65 }
];

// ============================================================
// 2. STATE MANAGEMENT
// ============================================================
const players = new Map<string, any>();
const lootDrops = new Map<string, any>();
const deathBoxes = new Map<string, any>();

let match = {
  phase: 'WAITING',
  startTime: Date.now(),
  stormIndex: 0,
  stormWaiting: true,
  stormRadius: 2500,
  stormPrevRadius: 2500,
  stormTargetRadius: 2500,
  stormX: 2500, stormY: 2500,
  busProgress: 0,
};

// ============================================================
// 3. CORE UTILITIES
// ============================================================
function dist(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

function seedLoot() {
  lootDrops.clear();
  deathBoxes.clear();
  POIs.forEach(poi => {
    for (let i = 0; i < 8; i++) {
      const id = `loot_${poi.name}_${i}`;
      const roll = Math.random();
      const rarity = RARITIES[Math.floor(Math.random() * 4)];
      if (roll < 0.7) {
        const w = WEAPONS[Math.floor(Math.random() * WEAPONS.length)];
        lootDrops.set(id, { id, x: poi.x + (Math.random() * 400 - 200), y: poi.y + (Math.random() * 400 - 200), type: 'weapon', weaponId: w.id, name: w.name, rarity: rarity.level, color: rarity.color });
      } else {
        const c = CONSUMABLES[Math.floor(Math.random() * CONSUMABLES.length)];
        lootDrops.set(id, { id, x: poi.x + (Math.random() * 400 - 200), y: poi.y + (Math.random() * 400 - 200), type: 'consumable', consumableId: c.id, name: c.name, rarity: 'common', color: '#FFF' });
      }
    }
  });
  // Mythic Drop
  lootDrops.set('mythic_bow', { id: 'mythic_bow', x: 1200, y: 3800, type: 'weapon', weaponId: 'skeleton_coast_rifle', name: 'Kalahari Obsidian Bow', rarity: 'mythic', color: '#FFD700' });
}

function handleDamage(victim: any, dmg: number, attacker?: any) {
  if (!victim.alive) return;
  victim.lastDamageTime = Date.now();
  if (victim.channeling) { io.to(victim.id).emit("consume_interrupted"); victim.channeling = null; }

  let remaining = dmg;
  if (victim.overshield > 0) { const d = Math.min(victim.overshield, remaining); victim.overshield -= d; remaining -= d; }
  if (remaining > 0 && victim.shield > 0) { const d = Math.min(victim.shield, remaining); victim.shield -= d; remaining -= d; }
  if (remaining > 0) victim.health -= remaining;

  victim.health = Math.max(0, victim.health);
  if (victim.health <= 0) {
    victim.alive = false;
    const items = victim.inventory.filter((i:any) => i !== null);
    deathBoxes.set(`box_${victim.id}`, { id: `box_${victim.id}`, x: victim.x, y: victim.y, items, username: victim.username });
    io.to("arena_1").emit("kill_feed", { attacker: attacker?.username || "Storm", victim: victim.username });
  }
  io.to("arena_1").emit("player_state_sync", { id: victim.id, hp: victim.health, sh: victim.shield, os: victim.overshield });
}

// ============================================================
// 4. THE AUTHORITATIVE HEARTBEAT (20Hz)
// ============================================================
seedLoot();
setInterval(() => {
  const now = Date.now();
  if (match.phase === 'ACTIVE') {
    const sp = STORM_PHASES[match.stormIndex];
    if (match.stormWaiting) {
      if (now - match.startTime > sp.wait) { match.stormWaiting = false; match.startTime = now; match.stormPrevRadius = match.stormRadius; }
    } else {
      const elapsed = now - match.startTime;
      const t = Math.min(1, elapsed / sp.shrink);
      match.stormRadius = match.stormPrevRadius + (sp.radius - match.stormPrevRadius) * t;
      if (t >= 1) { match.stormIndex = Math.min(STORM_PHASES.length - 1, match.stormIndex + 1); match.stormWaiting = true; match.startTime = now; }
    }

    players.forEach(p => {
      if (!p.alive) return;
      if (dist(p.x, p.y, match.stormX, match.stormY) > match.stormRadius) handleDamage(p, sp.dps / 20);
      if (now - p.lastDamageTime > OVERSHIELD_REGEN_DELAY && p.overshield < OVERSHIELD_MAX) p.overshield = Math.min(OVERSHIELD_MAX, p.overshield + 0.5);
      if (p.channeling && now - p.channeling.start > p.channeling.dur) {
        const item = CONSUMABLES.find(c => c.id === p.channeling.cid);
        if (item?.type === 'health') p.health = Math.min(100, p.health + item.amt);
        else if (item) p.shield = Math.min(100, p.shield + item.amt);
        p.inventory[p.channeling.slot] = null;
        io.to(p.id).emit("consume_success", { hp: p.health, sh: p.shield });
        p.channeling = null;
      }
    });

    const alive = Array.from(players.values()).filter(p => p.alive);
    if (alive.length === 1 && players.size > 1) {
       match.phase = 'FINISHED';
       io.to("arena_1").emit("victory", { winner: alive[0].username });
       setTimeout(() => { match.phase = 'WAITING'; players.clear(); seedLoot(); }, MATCH_RESET_DELAY);
    }
  }

  io.to("arena_1").emit("world_update", { players: Object.fromEntries(players), loot: Object.fromEntries(lootDrops), boxes: Object.fromEntries(deathBoxes), storm: match });
}, TICK_RATE);

// ============================================================
// 5. NETWORK HANDLERS (Cross-Platform)
// ============================================================
io.on("connection", (socket: Socket) => {
  logger.info({ id: socket.id }, "Net: Connection Handshake Initiated");

  // THE CROSS-PLATFORM SECURITY GATE
  socket.on("handshake", (data: { version: string, platform: string }) => {
    if (data.version !== REQUIRED_VERSION) {
      socket.emit("error", { message: "Version Mismatch. Update Required.", code: "VER_ERR" });
      return;
    }
    logger.info({ id: socket.id, os: data.platform }, "Net: Handshake Verified");
  });

  socket.on("enter_arena", (data: { username: string }) => {
    socket.join("arena_1");
    players.set(socket.id, { id: socket.id, username: data.username || "Recruit", x: 2500, y: 2500, health: 100, shield: 0, overshield: 50, alive: true, inventory: Array(5).fill(null), equipped: 0, lastDamageTime: 0, lastFireTime: 0, heading: 0, channeling: null });
    if (match.phase === 'WAITING' && players.size >= 1) { match.phase = 'ACTIVE'; match.startTime = Date.now(); }
    logger.info({ user: data.username }, "Player Deployed");
  });

  socket.on("player_move", (data: { x: number, y: number, h: number }) => {
    const p = players.get(socket.id);
    if (p && p.alive) { p.x = data.x; p.y = data.y; p.heading = data.h; }
  });

  socket.on("fire_weapon", (data: { tx: number, ty: number }) => {
    const p = players.get(socket.id);
    if (!p || !p.alive || Date.now() - p.lastFireTime < 200) return;
    p.lastFireTime = Date.now();
    players.forEach((v, vid) => {
      if (vid !== socket.id && v.alive && dist(v.x, v.y, data.tx, data.ty) < 45) {
        handleDamage(v, 22, p);
        io.to("arena_1").emit("hit", { id: vid, x: v.x, y: v.y });
      }
    });
  });

  socket.on("pickup_loot", (lootId: string) => {
    const p = players.get(socket.id);
    const item = lootDrops.get(lootId);
    if (p && item && dist(p.x, p.y, item.x, item.y) < 150) {
      const slot = p.inventory.indexOf(null);
      if (slot !== -1) { p.inventory[slot] = item; lootDrops.delete(lootId); socket.emit("inv_sync", p.inventory); }
    }
  });

  socket.on("use_item", (slot: number) => {
    const p = players.get(socket.id);
    const item = p?.inventory[slot];
    if (p && item?.type === 'consumable') {
      const def = CONSUMABLES.find(c => c.id === item.consumableId);
      p.channeling = { start: Date.now(), dur: def!.time, cid: def!.id, slot };
      socket.emit("consume_start", { name: def!.name, dur: def!.time });
    }
  });

  socket.on("disconnect", () => { players.delete(socket.id); logger.info("Player Disconnected"); });
});

httpServer.listen(port, "0.0.0.0", () => {
  logger.info({ port }, "🏜️ NAMIB AUTHORITATIVE ENGINE: GOLD MASTER ONLINE");
});