import { createServer } from "http";
import { Server, Socket } from "socket.io";
import app from "./app";
import { logger } from "./lib/logger";

const port = Number(process.env["PORT"] || "5000");
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

interface Player { x: number; y: number; username: string; health: number; }
interface Loot { id: string; x: number; y: number; type: string; name: string; }

const players = new Map<string, Player>();
const lootDrops = new Map<string, Loot>();

// --- SEED INITIAL LOOT ---
for (let i = 0; i < 20; i++) {
  const id = `loot_${i}`;
  lootDrops.set(id, {
    id,
    x: 1000 + Math.random() * 3000,
    y: 1000 + Math.random() * 3000,
    type: Math.random() > 0.5 ? 'weapon' : 'armor',
    name: Math.random() > 0.5 ? 'Oryx Rifle' : 'Kalahari Vest'
  });
}

// Game Loop: 20Hz
setInterval(() => {
  io.to("arena_1").emit("world_update", { 
    players: Object.fromEntries(players),
    loot: Object.fromEntries(lootDrops),
    storm: { x: 2500, y: 2500, radius: 2200 }
  });
}, 50);

io.on("connection", (socket: Socket) => {
  socket.on("enter_arena", (data: { username: string }) => {
    socket.join("arena_1");
    players.set(socket.id, { x: 2500, y: 2500, username: data.username || "Recruit", health: 100 });
  });

  socket.on("player_move", (data: { x: number, y: number }) => {
    const p = players.get(socket.id);
    if (p) { p.x = data.x; p.y = data.y; }
  });

  // --- NEW: LOOT PICKUP LOGIC ---
  socket.on("pickup_loot", (lootId: string) => {
    const item = lootDrops.get(lootId);
    if (item) {
      lootDrops.delete(lootId);
      socket.emit("item_added", item);
      logger.info({ user: socket.id, item: item.name }, "Player picked up loot");
    }
  });

  // --- UPDATED LOOT TABLE WITH RARITIES ---
const RARITIES = [
  { level: 'common', color: '#9CA3AF', weight: 50 },    // Grey
  { level: 'uncommon', color: '#22C55E', weight: 25 },  // Green
  { level: 'rare', color: '#3B82F6', weight: 15 },      // Blue
  { level: 'epic', color: '#A855F7', weight: 7 },       // Purple
  { level: 'legendary', color: '#F5A623', weight: 3 }   // Orange
];

function getRandomRarity() {
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const r of RARITIES) {
    cumulative += r.weight;
    if (roll <= cumulative) return r;
  }
  return RARITIES[0];
}

// SEEDING THE WORLD
for (let i = 0; i < 30; i++) {
  const rarity = getRandomRarity();
  const id = `loot_${i}`;
  lootDrops.set(id, {
    id,
    x: Math.random() * 4000 + 500,
    y: Math.random() * 4000 + 500,
    type: 'weapon',
    name: 'Oryx-7',
    rarity: rarity.level,
    color: rarity.color
  });
}

  socket.on("disconnect", () => {
    players.delete(socket.id);
    io.to("arena_1").emit("player_left", socket.id);
  });
});

httpServer.listen(port, "0.0.0.0", () => logger.info({ port }, "NAMIB COMBAT SERVER LIVE"));
