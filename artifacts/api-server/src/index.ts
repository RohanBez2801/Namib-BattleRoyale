import { createServer } from "http";
import { Server, Socket } from "socket.io";
import app from "./app";
import { logger } from "./lib/logger";

const port = Number(process.env["PORT"] || "5000");
const httpServer = createServer(app);

// Initialize Socket.io with explicit CORS for Replit
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

interface Player {
  x: number;
  y: number;
  username: string;
}

const players = new Map<string, Player>();

// Game Loop: 20 times per second
setInterval(() => {
  if (players.size > 0) {
    io.to("arena_1").emit("world_update", { 
      players: Object.fromEntries(players) 
    });
  }
}, 50);

io.on("connection", (socket: Socket) => {
  logger.info({ socketId: socket.id }, "Player connected");

  socket.on("enter_arena", (data: { username: string }) => {
    socket.join("arena_1");
    players.set(socket.id, { 
      x: 2500, 
      y: 2500, 
      username: data.username || "Recruit" 
    });
    logger.info({ user: data.username }, "Player entered arena");
  });

  socket.on("player_move", (data: { x: number, y: number }) => {
    const p = players.get(socket.id);
    if (p) {
      p.x = data.x;
      p.y = data.y;
    }
  });

  socket.on("disconnect", () => {
    players.delete(socket.id);
    io.to("arena_1").emit("player_left", socket.id);
    logger.info({ socketId: socket.id }, "Player left");
  });
});

httpServer.listen(port, "0.0.0.0", () => {
  logger.info({ port }, "NAMIB AUTHORITATIVE SERVER ONLINE");
});