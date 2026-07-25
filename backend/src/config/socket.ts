import { Server as Engine } from "@socket.io/bun-engine";
import { Server } from "socket.io";
import type { Request, Response } from "express";
import { CORS } from "./cors";
import type { AuthUser } from "./authToken";
import helmet from "helmet";
import { socketAuthMiddleware } from "../middleware/socketAuth.middleware";

export interface SocketData {
  user: AuthUser;
}

//SocketIO works, but is not ideal for this. Considering swapping it out for native Bun Sockets

//binary packet for game state and player moves

//packet-buffering - voltaile events
//heartbeat
//maxpayload

//should be able to use helmet

//const app = express();
const io = new Server({
  cors: CORS,
});

const engine = new Engine({
  path: "/socket.io/",
});

io.bind(engine);

//Express middleware only effects HTTP requests
io.engine.use(helmet());

//io.use((socket, next) => {});

io.use(socketAuthMiddleware);

io.on("connection", (socket) => {});
//Needs auth middleware passed

//needs socket map for connected users
