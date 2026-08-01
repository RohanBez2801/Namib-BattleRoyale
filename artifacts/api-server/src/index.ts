import { createServer } from "http";
import { Server, Socket } from "socket.io";
import app from "./app";
import { logger } from "./lib/logger";

const port = Number(process.env["PORT"] || "5000");
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// ============================================================
// CONSTANTS
// ============================================================
const MAP_SIZE = 5000;
const TICK_RATE = 50; // 20Hz
const MAX_SLOTS = 5;
const OVERSHIELD_MAX = 50;
const OVERSHIELD_REGEN_DELAY = 5000;
const BUS_DURATION = 20000; // 20s flight
const DROP_ALTITUDE = 1000;
const MATCH_START_DELAY = 3000;
const MATCH_RESET_DELAY = 15000;

// ============================================================
// TYPES
// ============================================================
type MatchPhase = 'WAITING' | 'BUS_PHASE' | 'ACTIVE' | 'ENDGAME' | 'FINISHED';

interface WeaponDef {
  id: string;
  name: string;
  category: 'ar' | 'shotgun' | 'smg' | 'sniper' | 'pistol';
  baseDmg: number;
  fireRateMs: number;
  hitRadius: number;
}

interface ConsumableDef {
  id: string;
  name: string;
  healType: 'health' | 'shield';
  healAmount: number;
  useTimeMs: number;
  channeled: boolean;
}

interface InventoryItem {
  id: string;
  type: 'weapon' | 'consumable';
  weaponId?: string;
  consumableId?: string;
  rarity: string;
  name: string;
  color: string;
}

interface Player {
  id: string;
  x: number;
  y: number;
  username: string;
  health: number;
  shield: number;
  overshield: number;
  lastDamageTime: number;
  lastFireTime: number;
  heading: number;
  alive: boolean;
  kills: number;
  damageDealt: number;
  survivalStart: number;
  inventory: (InventoryItem | null)[];
  equippedSlot: number;
  onBus: boolean;
  isDropping: boolean;
  altitude: number;
  hasLanded: boolean;
  channeling: { consumableId: string; slot: number; startTime: number } | null;
}

interface Loot {
  id: string;
  x: number;
  y: number;
  type: 'weapon' | 'consumable';
  weaponId?: string;
  consumableId?: string;
  name: string;
  rarity: string;
  color: string;
}

interface DeathBox {
  id: string;
  x: number;
  y: number;
  items: InventoryItem[];
  username: string;
  timestamp: number;
}

interface StormPhaseConfig {
  waitTimeMs: number;
  shrinkTimeMs: number;
  targetRadius: number;
  dps: number;
}

// ============================================================
// GAME DATA — NAMIBIAN ARSENAL
// ============================================================
const WEAPONS: WeaponDef[] = [
  { id: 'oryx_striker',         name: 'Oryx Striker',         category: 'ar',      baseDmg: 27, fireRateMs: 200,  hitRadius: 40 },
  { id: 'welwitschia_blaster',  name: 'Welwitschia Blaster',  category: 'shotgun', baseDmg: 80, fireRateMs: 800,  hitRadius: 60 },
  { id: 'sand_viper',           name: 'Sand Viper',           category: 'smg',     baseDmg: 18, fireRateMs: 100,  hitRadius: 35 },
  { id: 'skeleton_coast_rifle', name: 'Skeleton Coast',       category: 'sniper',  baseDmg: 95, fireRateMs: 1500, hitRadius: 20 },
  { id: 'bushmans_sidearm',     name: "Bushman's Sidearm",    category: 'pistol',  baseDmg: 22, fireRateMs: 350,  hitRadius: 45 },
];

const CONSUMABLES: ConsumableDef[] = [
  { id: 'mopane_caterpillar', name: 'Mopane Caterpillar', healType: 'health', healAmount: 25, useTimeMs: 2000, channeled: false },
  { id: 'elephant_bark_tea',  name: 'Elephant Bark Tea',  healType: 'shield', healAmount: 50, useTimeMs: 4000, channeled: true },
  { id: 'namibian_biltong',   name: 'Namibian Biltong',   healType: 'health', healAmount: 75, useTimeMs: 3000, channeled: true },
  { id: 'small_shield_pot',   name: 'Small Shield Pot',   healType: 'shield', healAmount: 25, useTimeMs: 2000, channeled: false },
];

const STORM_PHASES: StormPhaseConfig[] = [
  { waitTimeMs: 60000,  shrinkTimeMs: 90000, targetRadius: 2000, dps: 1 },
  { waitTimeMs: 45000,  shrinkTimeMs: 75000, targetRadius: 1500, dps: 2 },
  { waitTimeMs: 30000,  shrinkTimeMs: 60000, targetRadius: 1000, dps: 5 },
  { waitTimeMs: 20000,  shrinkTimeMs: 45000, targetRadius: 600,  dps: 8 },
  { waitTimeMs: 15000,  shrinkTimeMs: 30000, targetRadius: 300,  dps: 10 },
  { waitTimeMs: 10000,  shrinkTimeMs: 20000, targetRadius: 50,   dps: 15 },
];

const RARITIES = [
  { level: 'common',    color: '#9CA3AF', weight: 40, mult: 1.0 },
  { level: 'uncommon',  color: '#22C55E', weight: 25, mult: 1.1 },
  { level: 'rare',      color: '#3B82F6', weight: 18, mult: 1.2 },
  { level: 'epic',      color: '#A855F7', weight: 12, mult: 1.3 },
  { level: 'legendary', color: '#F5A623', weight: 5,  mult: 1.35 },
];

const POIS = [
  { name: 'Dune 45',           x: 2600, y: 2400, radius: 400 },
  { name: 'Skeleton Coast',    x: 1500, y: 1500, radius: 350 },
  { name: 'Deadvlei',          x: 3500, y: 1200, radius: 350 },
  { name: 'Fish River',        x: 800,  y: 3000, radius: 300 },
  { name: 'Sossusvlei Oasis',  x: 4200, y: 2800, radius: 350 },
  { name: 'Etosha Watchtower', x: 2000, y: 4200, radius: 300 },
  { name: 'Kolmanskop',        x: 3800, y: 3800, radius: 400 },
  { name: 'Spitzkoppe',        x: 1200, y: 800,  radius: 300 },
];

// ============================================================
// GLOBAL GAME STATE
// ============================================================
const players = new Map<string, Player>();
const lootDrops = new Map<string, Loot>();
const deathBoxes = new Map<string, DeathBox>();

let match = {
  phase: 'WAITING' as MatchPhase,
  phaseStartTime: Date.now(),
  stormPhaseIndex: 0,
  stormWaiting: true,
  stormShrinkStart: 0,
  bus: { startX: 0, startY: 0, endX: MAP_SIZE, endY: MAP_SIZE, progress: 0 },
  storm: {
    x: 2500, y: 2500,
    currentRadius: 2500,
    previousRadius: 2500,
    targetRadius: 2500,
    dps: 0,
  },
  aliveCount: 0,
};

let lootIdCounter = 0;

// ============================================================
// HELPERS
// ============================================================
function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function rollRarity() {
  const roll = Math.random() * 100;
  let cum = 0;
  for (const r of RARITIES) {
    cum += r.weight;
    if (roll <= cum) return r;
  }
  return RARITIES[0];
}

function generateBusPath() {
  const edges = ['top', 'bottom', 'left', 'right'] as const;
  const startEdge = edges[Math.floor(Math.random() * 4)];
  let endEdge = startEdge;
  while (endEdge === startEdge) endEdge = edges[Math.floor(Math.random() * 4)];

  const ptOnEdge = (edge: typeof edges[number]) => {
    const r = 500 + Math.random() * 4000;
    if (edge === 'top') return { x: r, y: 0 };
    if (edge === 'bottom') return { x: r, y: MAP_SIZE };
    if (edge === 'left') return { x: 0, y: r };
    return { x: MAP_SIZE, y: r };
  };

  const s = ptOnEdge(startEdge), e = ptOnEdge(endEdge);
  return { startX: s.x, startY: s.y, endX: e.x, endY: e.y, progress: 0 };
}

function busPosition(): { x: number; y: number } {
  const b = match.bus;
  return {
    x: b.startX + (b.endX - b.startX) * b.progress,
    y: b.startY + (b.endY - b.startY) * b.progress,
  };
}

function pickStormCenter(prevX: number, prevY: number, prevR: number, newR: number) {
  const maxOff = Math.max(0, (prevR - newR) * 0.6);
  const angle = Math.random() * Math.PI * 2;
  const d = Math.random() * maxOff;
  return {
    x: Math.max(newR, Math.min(MAP_SIZE - newR, prevX + Math.cos(angle) * d)),
    y: Math.max(newR, Math.min(MAP_SIZE - newR, prevY + Math.sin(angle) * d)),
  };
}

function applyDamage(target: Player, rawDmg: number) {
  let dmg = rawDmg;
  target.lastDamageTime = Date.now();

  // Interrupt channeled consumable
  if (target.channeling) {
    const def = CONSUMABLES.find(c => c.id === target.channeling!.consumableId);
    if (def?.channeled) {
      io.to("arena_1").emit("consumable_interrupted", { id: target.id });
      target.channeling = null;
    }
  }

  // 1. Over-shield
  if (target.overshield > 0) {
    const absorbed = Math.min(target.overshield, dmg);
    target.overshield -= absorbed;
    dmg -= absorbed;
  }
  // 2. Shield
  if (dmg > 0 && target.shield > 0) {
    const absorbed = Math.min(target.shield, dmg);
    target.shield -= absorbed;
    dmg -= absorbed;
  }
  // 3. Health
  if (dmg > 0) target.health -= dmg;

  target.health = Math.max(0, target.health);
}

function createDeathBox(p: Player) {
  const items = p.inventory.filter(Boolean) as InventoryItem[];
  if (items.length === 0) return;
  const box: DeathBox = {
    id: `db_${p.id}_${Date.now()}`,
    x: p.x, y: p.y,
    items, username: p.username,
    timestamp: Date.now(),
  };
  deathBoxes.set(box.id, box);
}

function firstEmptySlot(inv: (InventoryItem | null)[]): number {
  return inv.findIndex(s => s === null);
}

function countAlivePlayers(): number {
  let c = 0;
  players.forEach(p => { if (p.alive) c++; });
  return c;
}

// ============================================================
// WORLD SEEDING
// ============================================================
function seedWorld() {
  lootDrops.clear();
  deathBoxes.clear();
  lootIdCounter = 0;
  logger.info("Seeding Namib Desert with loot...");

  const spawnLoot = (x: number, y: number) => {
    const rarity = rollRarity();
    const id = `loot_${lootIdCounter++}`;
    const isConsumable = Math.random() < 0.25;

    if (isConsumable) {
      const cDef = CONSUMABLES[Math.floor(Math.random() * CONSUMABLES.length)];
      lootDrops.set(id, {
        id, x, y, type: 'consumable', consumableId: cDef.id,
        name: cDef.name, rarity: rarity.level, color: rarity.color,
      });
    } else {
      const wDef = WEAPONS[Math.floor(Math.random() * WEAPONS.length)];
      lootDrops.set(id, {
        id, x, y, type: 'weapon', weaponId: wDef.id,
        name: `${rarity.level.charAt(0).toUpperCase() + rarity.level.slice(1)} ${wDef.name}`,
        rarity: rarity.level, color: rarity.color,
      });
    }
  };

  // Random scatter (30 items)
  for (let i = 0; i < 30; i++) {
    spawnLoot(500 + Math.random() * 4000, 500 + Math.random() * 4000);
  }

  // POI clusters (4 items each = 32 items)
  for (const poi of POIS) {
    for (let j = 0; j < 4; j++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * poi.radius * 0.7;
      spawnLoot(
        Math.max(50, Math.min(MAP_SIZE - 50, poi.x + Math.cos(angle) * r)),
        Math.max(50, Math.min(MAP_SIZE - 50, poi.y + Math.sin(angle) * r)),
      );
    }
  }

  // Mythic loot (fixed locations)
  lootDrops.set('mythic_bow', {
    id: 'mythic_bow', x: 1200, y: 3800, type: 'weapon',
    weaponId: 'skeleton_coast_rifle',
    name: 'Kalahari Obsidian Bow', rarity: 'mythic', color: '#FFD700',
  });
  lootDrops.set('mythic_blade', {
    id: 'mythic_blade', x: 3800, y: 800, type: 'weapon',
    weaponId: 'welwitschia_blaster',
    name: 'Himba War Drum', rarity: 'mythic', color: '#FFD700',
  });

  logger.info({ total: lootDrops.size }, "Loot seeded");
}

// ============================================================
// MATCH PHASE MANAGEMENT
// ============================================================
function resetMatch() {
  match.phase = 'WAITING';
  match.phaseStartTime = Date.now();
  match.stormPhaseIndex = 0;
  match.stormWaiting = true;
  match.stormShrinkStart = 0;
  match.bus = { startX: 0, startY: 0, endX: MAP_SIZE, endY: MAP_SIZE, progress: 0 };
  match.storm = { x: 2500, y: 2500, currentRadius: 2500, previousRadius: 2500, targetRadius: 2500, dps: 0 };
  match.aliveCount = 0;

  // Clear all players (they should have disconnected)
  players.clear();
  seedWorld();
  io.to("arena_1").emit("match_phase", { phase: 'WAITING' });
  logger.info("Match reset — awaiting players");
}

function startBusPhase() {
  match.phase = 'BUS_PHASE';
  match.phaseStartTime = Date.now();
  match.bus = generateBusPath();

  // Put all current players on the bus
  players.forEach(p => {
    p.onBus = true;
    p.isDropping = false;
    p.hasLanded = false;
    p.alive = true;
    p.survivalStart = Date.now();
  });

  match.aliveCount = countAlivePlayers();
  io.to("arena_1").emit("match_phase", { phase: 'BUS_PHASE', bus: match.bus });
  logger.info({ players: players.size }, "Desert Hornet deployed");
}

function startActivePhase() {
  match.phase = 'ACTIVE';
  match.phaseStartTime = Date.now();
  match.stormPhaseIndex = 0;
  match.stormWaiting = true;

  // Initialize first storm phase
  const sp = STORM_PHASES[0];
  const center = pickStormCenter(match.storm.x, match.storm.y, match.storm.currentRadius, sp.targetRadius);
  match.storm.targetRadius = sp.targetRadius;
  match.storm.previousRadius = match.storm.currentRadius;
  match.storm.dps = sp.dps;
  match.storm.x = center.x;
  match.storm.y = center.y;

  io.to("arena_1").emit("match_phase", { phase: 'ACTIVE' });
  logger.info("Match ACTIVE — storm sequence initiated");
}

function triggerVictory(winner: Player | null) {
  match.phase = 'FINISHED';
  match.phaseStartTime = Date.now();

  if (winner) {
    const survTime = Math.round((Date.now() - winner.survivalStart) / 1000);
    io.to("arena_1").emit("victory_royale", {
      winnerId: winner.id,
      username: winner.username,
      kills: winner.kills,
      damageDealt: winner.damageDealt,
      survivalTimeSec: survTime,
    });
    logger.info({ winner: winner.username, kills: winner.kills }, "🏆 VICTORY ROYALE");
  }

  // Reset after delay
  setTimeout(() => resetMatch(), MATCH_RESET_DELAY);
}

// ============================================================
// AUTHORITATIVE GAME LOOP (20Hz)
// ============================================================
seedWorld();

setInterval(() => {
  const now = Date.now();

  // --- BUS PHASE ---
  if (match.phase === 'BUS_PHASE') {
    const elapsed = now - match.phaseStartTime;
    match.bus.progress = Math.min(1, elapsed / BUS_DURATION);
    const bp = busPosition();

    // Update players still on bus
    players.forEach(p => {
      if (p.onBus) { p.x = bp.x; p.y = bp.y; }
    });

    // Auto-eject everyone at end of bus path
    if (match.bus.progress >= 1) {
      players.forEach(p => {
        if (p.onBus) {
          p.onBus = false;
          p.isDropping = true;
          p.altitude = DROP_ALTITUDE;
        }
      });
    }

    // Check if all players have landed
    let allLanded = true;
    players.forEach(p => {
      if (p.onBus || p.isDropping) allLanded = false;
    });
    if (allLanded && players.size > 0) {
      startActivePhase();
    }
  }

  // --- DROPPING PLAYERS ---
  players.forEach(p => {
    if (p.isDropping) {
      p.altitude -= 20; // ~400 units/sec at 20Hz
      if (p.altitude <= 0) {
        p.altitude = 0;
        p.isDropping = false;
        p.hasLanded = true;
        io.to("arena_1").emit("player_landed", { id: p.id });
      }
    }
  });

  // --- ACTIVE PHASE ---
  if (match.phase === 'ACTIVE' || match.phase === 'ENDGAME') {
    const stormElapsed = now - match.phaseStartTime;

    // Storm phase logic
    if (match.stormPhaseIndex < STORM_PHASES.length) {
      const sp = STORM_PHASES[match.stormPhaseIndex];

      if (match.stormWaiting) {
        // Waiting period — storm is static
        if (stormElapsed - (match.stormShrinkStart || match.phaseStartTime) > sp.waitTimeMs) {
          match.stormWaiting = false;
          match.stormShrinkStart = now;
          match.storm.previousRadius = match.storm.currentRadius;
        }
      } else {
        // Shrinking period — interpolate radius
        const shrinkElapsed = now - match.stormShrinkStart;
        const t = Math.min(1, shrinkElapsed / sp.shrinkTimeMs);
        match.storm.currentRadius = match.storm.previousRadius + (sp.targetRadius - match.storm.previousRadius) * t;

        if (t >= 1) {
          // Advance to next phase
          match.stormPhaseIndex++;
          match.stormWaiting = true;
          match.stormShrinkStart = now;

          if (match.stormPhaseIndex < STORM_PHASES.length) {
            const nextSp = STORM_PHASES[match.stormPhaseIndex];
            const center = pickStormCenter(match.storm.x, match.storm.y, match.storm.currentRadius, nextSp.targetRadius);
            match.storm.targetRadius = nextSp.targetRadius;
            match.storm.previousRadius = match.storm.currentRadius;
            match.storm.dps = nextSp.dps;
            match.storm.x = center.x;
            match.storm.y = center.y;
          }
        }
      }
    }

    // Storm damage
    const currentDps = STORM_PHASES[Math.min(match.stormPhaseIndex, STORM_PHASES.length - 1)].dps;
    players.forEach(p => {
      if (!p.alive || !p.hasLanded) return;
      const d = dist(p.x, p.y, match.storm.x, match.storm.y);
      if (d > match.storm.currentRadius) {
        applyDamage(p, currentDps / 20); // per-tick damage
        if (p.health <= 0) {
          p.alive = false;
          createDeathBox(p);
          io.to("arena_1").emit("kill_feed", {
            attacker: '🌪 Sandstorm', victim: p.username, weapon: 'Storm',
          });
          io.to("arena_1").emit("player_eliminated", {
            eliminatedId: p.id, eliminatedBy: 'storm',
          });
        }
      }
    });

    // Over-shield regen
    players.forEach(p => {
      if (!p.alive || !p.hasLanded) return;
      if (now - p.lastDamageTime > OVERSHIELD_REGEN_DELAY && p.overshield < OVERSHIELD_MAX) {
        p.overshield = Math.min(OVERSHIELD_MAX, p.overshield + 1);
      }
    });

    // Consumable channeling
    players.forEach(p => {
      if (!p.alive || !p.channeling) return;
      const def = CONSUMABLES.find(c => c.id === p.channeling!.consumableId);
      if (!def) { p.channeling = null; return; }

      if (now - p.channeling.startTime >= def.useTimeMs) {
        // Apply heal
        if (def.healType === 'health') {
          p.health = Math.min(100, p.health + def.healAmount);
        } else {
          p.shield = Math.min(100, p.shield + def.healAmount);
        }
        // Remove consumable from inventory
        p.inventory[p.channeling.slot] = null;
        io.to("arena_1").emit("consumable_complete", {
          id: p.id, health: p.health, shield: p.shield, slot: p.channeling.slot,
        });
        p.channeling = null;
      }
    });

    // Victory check
    match.aliveCount = countAlivePlayers();
    const currentPhase: string = match.phase;
    if (match.aliveCount <= 1 && currentPhase !== 'FINISHED') {
      let winner: Player | null = null;
      players.forEach(p => { if (p.alive) winner = p; });
      triggerVictory(winner);
    }
  }

  // --- BROADCAST ---
  const playersPayload: Record<string, any> = {};
  players.forEach((p, id) => {
    playersPayload[id] = {
      id: p.id, x: p.x, y: p.y, username: p.username,
      health: p.health, shield: p.shield, overshield: p.overshield,
      heading: p.heading, alive: p.alive, kills: p.kills,
      equippedSlot: p.equippedSlot, inventory: p.inventory,
      onBus: p.onBus, isDropping: p.isDropping, altitude: p.altitude,
      hasLanded: p.hasLanded,
    };
  });

  io.to("arena_1").emit("world_update", {
    players: playersPayload,
    loot: Object.fromEntries(lootDrops),
    deathBoxes: Object.fromEntries(deathBoxes),
    match: {
      phase: match.phase,
      bus: match.bus,
      storm: match.storm,
      aliveCount: match.aliveCount,
      stormPhaseIndex: match.stormPhaseIndex,
      stormWaiting: match.stormWaiting,
    },
  });
}, TICK_RATE);

// ============================================================
// NETWORK COMMUNICATION
// ============================================================
io.on("connection", (socket: Socket) => {
  logger.info({ socketId: socket.id }, "Client connected to Namib Net");

  // --- JOIN MATCH ---
  socket.on("enter_arena", (data: { username: string }) => {
    socket.join("arena_1");
    const p: Player = {
      id: socket.id,
      x: 2500, y: 2500,
      username: data.username || "Recruit",
      health: 100, shield: 0, overshield: OVERSHIELD_MAX,
      lastDamageTime: 0, lastFireTime: 0,
      heading: 0, alive: true,
      kills: 0, damageDealt: 0, survivalStart: Date.now(),
      inventory: [null, null, null, null, null],
      equippedSlot: 0,
      onBus: match.phase === 'BUS_PHASE',
      isDropping: false, altitude: 0, hasLanded: match.phase === 'WAITING',
      channeling: null,
    };
    players.set(socket.id, p);
    match.aliveCount = countAlivePlayers();

    // Auto-start bus if first player and we're waiting
    if (match.phase === 'WAITING') {
      setTimeout(() => {
        if (match.phase === 'WAITING' && players.size > 0) {
          startBusPhase();
        }
      }, MATCH_START_DELAY);
    }

    logger.info({ user: data.username, phase: match.phase }, "Player deployed");
  });

  // --- JUMP FROM BUS ---
  socket.on("jump_from_bus", () => {
    const p = players.get(socket.id);
    if (!p || !p.onBus) return;
    const bp = busPosition();
    p.x = bp.x;
    p.y = bp.y;
    p.onBus = false;
    p.isDropping = true;
    p.altitude = DROP_ALTITUDE;
    io.to("arena_1").emit("player_jumped", { id: socket.id, x: bp.x, y: bp.y });
  });

  // --- MOVEMENT ---
  socket.on("player_move", (data: { x: number; y: number; heading?: number }) => {
    const p = players.get(socket.id);
    if (!p || !p.hasLanded || !p.alive) return;
    p.x = Math.max(0, Math.min(MAP_SIZE, data.x));
    p.y = Math.max(0, Math.min(MAP_SIZE, data.y));
    if (data.heading !== undefined) p.heading = data.heading;
  });

  // --- FIRE WEAPON ---
  socket.on("fire_weapon", (data: { targetX: number; targetY: number }) => {
    const attacker = players.get(socket.id);
    if (!attacker || !attacker.alive || !attacker.hasLanded) return;

    // Cancel consumable channeling on fire
    if (attacker.channeling) {
      io.to("arena_1").emit("consumable_interrupted", { id: attacker.id });
      attacker.channeling = null;
    }

    const equipped = attacker.inventory[attacker.equippedSlot];
    let dmg: number, fireRate: number, hitRad: number, weaponName: string;

    if (equipped && equipped.type === 'weapon' && equipped.weaponId) {
      const wDef = WEAPONS.find(w => w.id === equipped.weaponId);
      if (!wDef) return;
      const rarityData = RARITIES.find(r => r.level === equipped.rarity);
      const mult = rarityData?.mult ?? 1.0;
      dmg = Math.round(wDef.baseDmg * mult);
      fireRate = wDef.fireRateMs;
      hitRad = wDef.hitRadius;
      weaponName = equipped.name;
    } else {
      // Fists (no weapon)
      dmg = 20; fireRate = 500; hitRad = 30; weaponName = 'Fists';
    }

    if (Date.now() - attacker.lastFireTime < fireRate) return;
    attacker.lastFireTime = Date.now();

    players.forEach((target, targetId) => {
      if (targetId === socket.id || !target.alive || !target.hasLanded) return;
      const d = dist(target.x, target.y, data.targetX, data.targetY);

      if (d < hitRad) {
        applyDamage(target, dmg);
        attacker.damageDealt += dmg;

        io.to("arena_1").emit("player_damaged", {
          id: targetId,
          health: target.health, shield: target.shield, overshield: target.overshield,
          attackerId: socket.id, damage: dmg,
        });

        if (target.health <= 0) {
          target.alive = false;
          attacker.kills++;
          createDeathBox(target);
          match.aliveCount = countAlivePlayers();

          io.to("arena_1").emit("kill_feed", {
            attacker: attacker.username, victim: target.username, weapon: weaponName,
            attackerId: socket.id, victimId: targetId,
          });
          io.to("arena_1").emit("player_eliminated", {
            eliminatedId: targetId, eliminatedBy: socket.id,
            placement: match.aliveCount + 1,
          });
          logger.info({ attacker: attacker.username, target: target.username, weapon: weaponName }, "ELIMINATION");
        }
      }
    });
  });

  // --- SWAP WEAPON ---
  socket.on("swap_weapon", (slotIndex: number) => {
    const p = players.get(socket.id);
    if (!p || slotIndex < 0 || slotIndex >= MAX_SLOTS) return;
    p.equippedSlot = slotIndex;
    // Cancel channeling on weapon swap
    if (p.channeling) {
      io.to("arena_1").emit("consumable_interrupted", { id: p.id });
      p.channeling = null;
    }
  });

  // --- PICKUP LOOT ---
  socket.on("pickup_loot", (lootId: string) => {
    const item = lootDrops.get(lootId);
    const p = players.get(socket.id);
    if (!item || !p || !p.alive || !p.hasLanded) return;

    const d = dist(item.x, item.y, p.x, p.y);
    if (d > 150) return;

    let slot = firstEmptySlot(p.inventory);
    if (slot === -1) {
      // Full inventory — swap with equipped slot
      slot = p.equippedSlot;
      const dropped = p.inventory[slot];
      if (dropped) {
        // Drop currently equipped item back as ground loot
        const droppedId = `loot_${lootIdCounter++}`;
        lootDrops.set(droppedId, {
          id: droppedId, x: p.x, y: p.y,
          type: dropped.type, weaponId: dropped.weaponId, consumableId: dropped.consumableId,
          name: dropped.name, rarity: dropped.rarity, color: dropped.color,
        });
      }
    }

    p.inventory[slot] = {
      id: item.id, type: item.type,
      weaponId: item.weaponId, consumableId: item.consumableId,
      rarity: item.rarity, name: item.name, color: item.color,
    };
    lootDrops.delete(lootId);

    socket.emit("inventory_update", { inventory: p.inventory, equippedSlot: p.equippedSlot });
    logger.info({ user: p.username, item: item.name }, "Loot secured");
  });

  // --- DROP ITEM ---
  socket.on("drop_item", (slotIndex: number) => {
    const p = players.get(socket.id);
    if (!p || !p.alive || slotIndex < 0 || slotIndex >= MAX_SLOTS) return;
    const item = p.inventory[slotIndex];
    if (!item) return;

    const droppedId = `loot_${lootIdCounter++}`;
    lootDrops.set(droppedId, {
      id: droppedId, x: p.x, y: p.y,
      type: item.type, weaponId: item.weaponId, consumableId: item.consumableId,
      name: item.name, rarity: item.rarity, color: item.color,
    });
    p.inventory[slotIndex] = null;
    socket.emit("inventory_update", { inventory: p.inventory, equippedSlot: p.equippedSlot });
  });

  // --- USE CONSUMABLE ---
  socket.on("use_consumable", (slotIndex: number) => {
    const p = players.get(socket.id);
    if (!p || !p.alive || p.channeling || slotIndex < 0 || slotIndex >= MAX_SLOTS) return;
    const item = p.inventory[slotIndex];
    if (!item || item.type !== 'consumable' || !item.consumableId) return;
    const def = CONSUMABLES.find(c => c.id === item.consumableId);
    if (!def) return;

    // Can't overheal
    if (def.healType === 'health' && p.health >= 100) return;
    if (def.healType === 'shield' && p.shield >= 100) return;

    p.channeling = { consumableId: def.id, slot: slotIndex, startTime: Date.now() };
    socket.emit("consumable_started", {
      consumableId: def.id, name: def.name, useTimeMs: def.useTimeMs, slot: slotIndex,
    });
  });

  // --- LOOT DEATH BOX ---
  socket.on("loot_deathbox", (data: { boxId: string; itemIndex: number }) => {
    const p = players.get(socket.id);
    const box = deathBoxes.get(data.boxId);
    if (!p || !box || !p.alive || !p.hasLanded) return;
    if (dist(p.x, p.y, box.x, box.y) > 150) return;
    if (data.itemIndex < 0 || data.itemIndex >= box.items.length) return;

    const item = box.items[data.itemIndex];
    let slot = firstEmptySlot(p.inventory);
    if (slot === -1) {
      // Swap with equipped
      slot = p.equippedSlot;
      const dropped = p.inventory[slot];
      if (dropped) box.items.push(dropped);
    }

    p.inventory[slot] = item;
    box.items.splice(data.itemIndex, 1);
    if (box.items.length === 0) deathBoxes.delete(data.boxId);

    socket.emit("inventory_update", { inventory: p.inventory, equippedSlot: p.equippedSlot });
  });

  // --- DISCONNECT ---
  socket.on("disconnect", () => {
    const p = players.get(socket.id);
    if (p && p.alive && match.phase === 'ACTIVE') {
      createDeathBox(p);
      io.to("arena_1").emit("kill_feed", {
        attacker: '📡 Disconnect', victim: p.username, weapon: 'Left Match',
      });
    }
    players.delete(socket.id);
    match.aliveCount = countAlivePlayers();
    io.to("arena_1").emit("player_left", socket.id);
    logger.info({ socketId: socket.id }, "Player disconnected");
  });

  /*
    BUILDING MODE (DISABLED FOR ZERO-BUILD MILESTONE)
    socket.on("place_structure", (data) => { ... })
  */
});

// ============================================================
// START SERVER
// ============================================================
httpServer.listen(port, "0.0.0.0", () => {
  logger.info({ port }, "🏜️ NAMIB BATTLE ROYALE ENGINE ONLINE");
});