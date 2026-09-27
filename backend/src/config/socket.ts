import { Server as Engine } from "@socket.io/bun-engine";
import { Server, Socket, type DefaultEventsMap } from "socket.io";
import { PresenceRegistry } from "../lib/presenceRegistry";
import { CORS_POLICY } from "./cors";
import { ENV } from "./env";
import type { AuthUser } from "./authToken";
import { socketAuthMiddleware } from "../middleware/socketAuth.middleware";

//NOTE: SocketIO docs say that the auth only happens on the initial handshake
//If I switch to a stateful token later, I need to figure out how to handle this

//unimportant for now: protobuf for faster serialization

//additional consideration, SocketIO can buffer requests and wait for an ack then send them again if it fails
//it appears this approach has limitations at scale, but I'll worry about that later

//might be able to run separate connection for individual game sessions in another container when we get there

//Using SocketIO for now, but B has its own Bun Socket implementation of sockets

//socketio can be used to send binary events, could be useful for game state and player moves when speed really matters

//packet-buffering - volatile events
//heartbeat
//maxpayload

type SocketData = AuthUser;

export type AppSocket = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>;
type AppServer = Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>;

//need to enable connection state recover, not active right now
const io: AppServer = new Server({
  cors: CORS_POLICY,
});

const engine = new Engine({
  path: "/socket.io/",
  cors: CORS_POLICY,
});

io.bind(engine);

// !!! socketIO might still need a cors policy for long polling
//Express middleware only effects HTTP requests (like long polling)
//io.engine.use(helmet()); //I think because we're using Bun and not Node this isn't working

//middleware is guaranteed to be run before before the server start accepting events
io.use((socket, next) => {
  void socketAuthMiddleware(socket, next);
});

// !!! should I still plan on splitting this into lib? Seems like probably not.

//I need to read more about why this cannot be async, it's obvious I'm doing something wrong here
io.on("connection", (socket) => {
  console.log(`User connected [${socket.data.username}] on socket [${socket.id}]`);

  //my understanding is the server doesn't run events until connection is run, so there is no race here
  void PresenceRegistry.onSocketConnect(socket.id, socket.data.userId);

  socket.on("disconnect", () => {
    console.log(`User disconnected [${socket.data.username}] on socket [${socket.id}]`);
    PresenceRegistry.onSocketDisconnect(socket.id);
  });
});

//dedicated Bun-native server for the engine, Express's own app.listen() is a separate
//Node compat HTTP server and can't share a port with Bun.serve()'s fetch/websocket handlers
Bun.serve({
  port: ENV.SOCKET_PORT,
  ...engine.handler(),
});

console.log(`Socket.IO listening on port ${ENV.SOCKET_PORT}`);

export { io };
