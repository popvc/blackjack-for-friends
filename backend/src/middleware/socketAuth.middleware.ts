//import type { Socket } from "@socket.io/bun-engine/dist/socket";
import type { NextFunction } from "express";
import { verifyToken } from "../config/authToken";
import { Socket } from "socket.io";

export const socketAuthMiddleware = async (socket: Socket, next: NextFunction) => {
  try {
    const token = socket.handshake.headers.cookie
      ?.split("; ")
      .find((row) => row.startsWith("jwt="))
      ?.split("=")[1];

    console.log("socketAuthMiddleware", token);

    if (!token) {
      console.log("Socket connection rejected: Auth token not found");
      return next(new Error("Unauthorized - Token not found"));
    }

    const user = await verifyToken(token);

    if (!user) {
      console.log("Socket connection rejected: Invalid token");
      return next(new Error("Unauthorized - Invalid token"));
    }

    //more extensions
    socket.data.user = user;

    console.log(`SocketIO authenticated. ${user}`)

    next();
  } catch (e: unknown) {
    console.log("SocketIO auth error:", e);
    next(new Error("Unauthorized - Authentication failed"));
  }
};
