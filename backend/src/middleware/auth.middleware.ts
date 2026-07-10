import type { Request, Response, NextFunction } from "express";

import { verifyToken } from "../config/authToken";

export const protectRoute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    //jwt is the name of the cookie and is what we defined in utils.js as a string
    const token = req.cookies.jwt;
    if (!token) return res.status(401).json({ message: "Unauthorized: no token received" });

    const userId = await verifyToken(token);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: invalid token" });
    }

    req.userId = userId;

    next();
  } catch (error) {
    console.error("Error in protectRoute middleware:", error);
    res.status(500).json({ message: "Internal server error!" });
  }
};
