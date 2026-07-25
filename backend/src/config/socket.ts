import { Server as Engine } from "@socket.io/bun-engine";
import { Server } from "socket.io";
import express from "express";
import type { Request, Response } from "express";
import { CORS } from "./cors";

interface SocketData {
  recipientId: string;
  senderId: string;
}

//SocketIO works, but is not ideal for this. Considering swapping it out for native Bun Sockets

//binary packet for game state and player moves

//packet-buffering - voltaile events
//heartbeat
//maxpayload

const app = express();

const io = new Server({
  cors: CORS,
});

const engine = new Engine({
  path: "/socket.io/",
});

io.bind(engine);

//io.use()

io.on("connection", (socket) => {});
//Needs auth middleware passed

//needs socket map for connected users
