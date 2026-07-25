import { Server as Engine } from "@socket.io/bun-engine";
import { Server } from "socket.io";
import type { Request, Response } from "express";
import { CORS } from "./cors";
import type { AuthUser } from "./authToken";

interface SocketData {
  user: AuthUser;
}

//SocketIO works, but is not ideal for this. Considering swapping it out for native Bun Sockets

//binary packet for game state and player moves

//packet-buffering - voltaile events
//heartbeat
//maxpayload

//const app = express();
function startSocketServer() {
  const io = new Server<SocketData>({
    cors: CORS,
  });

  const engine = new Engine({
    path: "/socket.io/",
  });

  io.bind(engine);

  //io.use()

  io.on("connection", (socket) => {});
  //Needs auth middleware passed
}

//needs socket map for connected users
