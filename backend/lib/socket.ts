import { Server as Engine } from "@socket.io/bun-engine"
import { Server } from "socket.io"
import express from "express";
import type { Request, Response} from "express"
import { CORS } from "../config/cors";

//packet-buffering - voltaile events
//heartbeat
//maxpayload

const app = express();

const io = new Server({
    cors: CORS
});
const engine = new Engine({
    path: "/socket.io/"
})

io.bind(engine);

//Needs auth middleware passed

//needs socket map for connected users


