import type { Request, Response, NextFunction } from "express";

import { verifyToken, type AuthUser } from "../config/authToken";

export const protectRoute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    //jwt is the name of the cookie and is what we defined in utils.js as a string
    const token = req.cookies.jwt;
    if (!token) return res.status(401).json({ message: "Unauthorized: no token received" });

    const user = await verifyToken(token);

    if (!user) {
      return res.status(401).json({ message: "Unauthorized: invalid token" });
    }

    req.user = { userId: user.userId, username: user.username, email: user.email };

    next();
  } catch (error) {
    console.error("Error in protectRoute middleware:", error);
    res.status(500).json({ message: "Internal server error!" });
  }
};
