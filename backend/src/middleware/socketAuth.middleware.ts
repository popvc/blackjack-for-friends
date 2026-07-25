import type { Socket } from "@socket.io/bun-engine/dist/socket";
import type { NextFunction } from "express";

export const socketAuthMiddleware = async (socket: Socket, next: NextFunction) => {
    try {

        next();
    }catch (e: unknown){
        console.log("SocketIO auth error:", e)
        next(new Error("Unauthorized"))
    }
};
