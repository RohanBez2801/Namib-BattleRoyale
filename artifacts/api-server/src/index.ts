import { createServer } from "http";
import { Server, Socket } from "socket.io";
import app from "./app";
import { logger } from "./lib/logger";

const port = Number(process.env["PORT"] || "5000");
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

interface Player { x: number; y: number; username: string; }
const players = new Map<string, Player>();

// Authoritative World Update (Tick Rate: 20Hz)
setInterval(() => {
  if (players.size > 0) {
    io.to("arena_1").emit("world_update", { 
      players: Object.fromEntries(players),
      storm: { x: 2500, y: 2500, radius: 2000 } // Initial Storm
    });
  }
}, 50);

io.on("connection", (socket: Socket) => {
  socket.on("enter_arena", (data: { username: string }) => {
    socket.join("arena_1");
    players.set(socket.id, { x: 2500, y: 2500, username: data.username || "Recruit" });
  });

  socket.on("player_move", (data: { x: number, y: number }) => {
    const p = players.get(socket.id);
    if (p) { p.x = data.x; p.y = data.y; }
  });

  socket.on("disconnect", () => {
    players.delete(socket.id);
    io.to("arena_1").emit("player_left", socket.id);
  });
});

httpServer.listen(port, "0.0.0.0", () => logger.info({ port }, "SERVER LIVE"));