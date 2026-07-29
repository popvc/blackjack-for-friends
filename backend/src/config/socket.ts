import { Server as Engine } from "@socket.io/bun-engine";
import { Server } from "socket.io";
import { CORS_POLICY } from "./cors";
import helmet from "helmet";
import { socketAuthMiddleware } from "../middleware/socketAuth.middleware";
import { UserPresence } from "../lib/userPresence";

//unimportant for now: protobuf for faster serialization

//additional consideration, SocketIO can buffer requests and wait for an ack then send them again if it fails
//it appears this approach has limitations at scale, but I'll worry about that later

//might be able to run separate connection for individual game sessions in another container when we get there

//Using SocketIO for now, but B has its own Bun Socket implementation of sockets

//socketio can be used to send binary events, could be useful for game state and player moves when speed really matters

//packet-buffering - volatile events
//heartbeat
//maxpayload

//need to enable connection state recover, not active right now
const io = new Server({
  cors: CORS_POLICY,
});

const engine = new Engine({
  path: "/socket.io/",
});

io.bind(engine);

//Express middleware only effects HTTP requests (like long polling)
//io.engine.use(helmet()); //I think because we're using Bun and not Node this isn't working

io.use(socketAuthMiddleware);

//TODO: This should be split then moved to /lib eventually

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.data.username}`);
  UserPresence.onSocketConnect(socket.id, socket.data.userId);

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.data.username}`);
    UserPresence.onSocketDisconnect(socket.id);
  });
});

export { io };