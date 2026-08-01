import { createServer } from "http";
import { Server, Socket } from "socket.io";
import app from "./app";
import { logger } from "./lib/logger";

const port = Number(process.env["PORT"] || "5000");
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// --- CONSTANTS & INTERFACES ---
const MAP_SIZE = 5000;
const TICK_RATE = 50; // 20Hz

interface Player {
  id: string;
  x: number;
  y: number;
  username: string;
  health: number;
  heading: number;
}

interface Loot {
  id: string;
  x: number;
  y: number;
  type: 'weapon' | 'armor' | 'mythic';
  name: string;
  rarity: string;
  color: string;
}

// --- GLOBAL GAME STATE ---
const players = new Map<string, Player>();
const lootDrops = new Map<string, Loot>();
let storm = {
  x: 2500,
  y: 2500,
  radius: 2500,
  targetRadius: 500,
  isShrinking: true
};

const RARITIES = [
  { level: 'common', color: '#9CA3AF', weight: 50 }, // Grey
  { level: 'uncommon', color: '#22C55E', weight: 25 }, // Green
  { level: 'rare', color: '#3B82F6', weight: 15 }, // Blue
  { level: 'epic', color: '#A855F7', weight: 7 }, // Purple
  { level: 'legendary', color: '#F5A623', weight: 3 }  // Orange
];

// --- INITIAL SEEDING (Runs once on Startup) ---
function seedWorld() {
  logger.info("Seeding Namib Desert with loot...");

  // 1. Seed Random Loot
  for (let i = 0; i < 40; i++) {
    const roll = Math.random() * 100;
    let tier = RARITIES[0];
    let cumulative = 0;

    for (const r of RARITIES) {
      cumulative += r.weight;
      if (roll <= cumulative) {
        tier = r;
        break;
      }
    }

    const id = `loot_${i}`;
    lootDrops.set(id, {
      id,
      x: 500 + Math.random() * 4000,
      y: 500 + Math.random() * 4000,
      type: Math.random() > 0.3 ? 'weapon' : 'armor',
      name: tier.level === 'legendary' ? 'Advanced Oryx-7' : 'Desert Gear',
      rarity: tier.level,
      color: tier.color
    });
  }

  // 2. Seed Mythic Items (Boss Loot)
  lootDrops.set('mythic_bow', {
    id: 'mythic_bow',
    x: 1200, y: 3800,
    type: 'mythic',
    name: 'Kalahari Obsidian Bow',
    rarity: 'mythic',
    color: '#FFD700' // Gold
  });
}

seedWorld();

// --- AUTHORITATIVE GAME LOOP (20Hz) ---
setInterval(() => {
  // 1. Shrink Storm Logic
  if (storm.radius > storm.targetRadius) {
    storm.radius -= 0.3; // Smooth shrink speed
  }

  // 2. Broadcast Update
  io.to("arena_1").emit("world_update", {
    players: Object.fromEntries(players),
    loot: Object.fromEntries(lootDrops),
    storm: storm
  });
}, TICK_RATE);

// --- NETWORK COMMUNICATION ---
io.on("connection", (socket: Socket) => {
  logger.info({ socketId: socket.id }, "Client connected to Namib Net");

  socket.on("enter_arena", (data: { username: string }) => {
    socket.join("arena_1");
    players.set(socket.id, {
      id: socket.id,
      x: 2500,
      y: 2500,
      username: data.username || "Recruit",
      health: 100,
      heading: 0
    });
    logger.info({ user: data.username }, "Player deployed to Arena");
  });

  socket.on("player_move", (data: { x: number, y: number, heading?: number }) => {
    const p = players.get(socket.id);
    if (p) {
      // Authoritative Bounds & State Update
      p.x = Math.max(0, Math.min(MAP_SIZE, data.x));
      p.y = Math.max(0, Math.min(MAP_SIZE, data.y));
      if (data.heading !== undefined) p.heading = data.heading;
    }
  });

  socket.on("pickup_loot", (lootId: string) => {
    const item = lootDrops.get(lootId);
    const player = players.get(socket.id);

    if (item && player) {
      // Logic: Server-side distance check to prevent "teleport looting"
      const dist = Math.sqrt(Math.pow(item.x - player.x, 2) + Math.pow(item.y - player.y, 2));

      if (dist < 150) { // Valid pickup range
        lootDrops.delete(lootId);
        socket.emit("item_added", item);
        logger.info({ user: player.username, item: item.name }, "Loot secured");
      }
    }
  });

  socket.on("disconnect", () => {
    players.delete(socket.id);
    io.to("arena_1").emit("player_left", socket.id);
    logger.info({ socketId: socket.id }, "Player disconnected");
  });
});

httpServer.listen(port, "0.0.0.0", () => {
  logger.info({ port }, "NAMIB AUTHORITATIVE COMBAT ENGINE ONLINE");
});