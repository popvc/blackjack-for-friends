//import type { Socket } from "@socket.io/bun-engine/dist/socket";
import { verifyToken } from "../config/authToken";
import { type ExtendedError } from "socket.io";
import type { AppSocket } from "../config/socket";

//a note on how SocketIO handles middleware-emit races. SocketIO has a protocol that matches between the front and back ends
// While a race is technically possible with middleware, it cannot happen accidentally as the client won't emit any
//events until the server has finished processing the middleware.
// TL;DR the default SocketIO protocol handles it, then(). wont produce a race by accident, but can if intentional.

export const socketAuthMiddleware = async (
  socket: AppSocket,
  next: (err?: ExtendedError) => void,
) => {
  //just remember to set it everytime in the client upon connection!!!
  //const token = socket.handshake.auth.jwt;
  //why am I doing this manually, doesn't express handle this?
  const token = socket.handshake.headers.cookie
    ?.split("; ")
    .find((row) => row.startsWith("jwt="))

    ?.split("=")[1];

  if (!token) {
    console.log("Socket connection rejected: Auth token not found");
    return void next(new Error("Unauthorized - Token not found"));
  }

  try {
    const user = await verifyToken(token);
    //.then((user) => {
    if (!user) {
      console.log("Socket connection rejected: Invalid token");
      return void next(new Error("Unauthorized - Invalid token"));
    }

    //more extensions
    socket.data.userId = user.userId;
    socket.data.username = user.username;
    socket.data.email = user.email;

    console.log(`SocketIO authenticated: ${user.username}`);

    void next();
    //   })
  } catch (e: unknown) {
    console.log("SocketIO auth error:", e);
    void next(new Error("Unauthorized - Authentication failed"));
  }
};
