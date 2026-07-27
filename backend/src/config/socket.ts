import { Server as Engine } from "@socket.io/bun-engine";
import { Server } from "socket.io";
import { CORS_POLICY } from "./cors";
import helmet from "helmet";
import { socketAuthMiddleware } from "../middleware/socketAuth.middleware";
import { onSocketConnect, onSocketDisconnect } from "../lib/userPresence";

//might be able to run separate connection for individual game sessions in another container

//SocketIO works, but is not ideal for this. Considering swapping it out for native Bun Sockets later

//binary packet for game state and player moves

//packet-buffering - voltaile events
//heartbeat
//maxpayload

//should be able to use helmet

//need to enable connection state recover, not active right now
const io = new Server({
  cors: CORS_POLICY,
});

const engine = new Engine({
  path: "/socket.io/",
});

io.bind(engine);

//Express middleware only effects HTTP requests (like long polling)
io.engine.use(helmet());

io.use(socketAuthMiddleware);

//TODO: This should be split then moved to /lib eventually

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.data.username}`);
  onSocketConnect(socket.id, socket.data.userId);

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.data.username}`);
    onSocketDisconnect(socket.id);
  });
});

//TODO:
// Need a way to resynchronize state for presence, contact requests, messages, game state and anything else
// Current idea is to use a compound DateTime and number increment for each message type, and compare on each connection
// though I should double check how it's actually supposed to be done.

export { io };