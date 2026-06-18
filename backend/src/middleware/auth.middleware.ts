import type { Request, Response, NextFunction } from "express";

import jwt from "jsonwebtoken";
import Profile from "../models/profile.schema";
import { ENV } from "../config/env";
import z from "zod";

const { JWT_SECRET } = ENV;
//const seomthingds: jwt.JwtPayload;

//Move this somewhere more appropriate later
interface JwtPayload {
  userId: string;
}

export const protectRoute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    //jwt is the name of the cookie and is what we defined in utils.js in the qoutation marks
    const token = req.cookies.jwt;
    if (!token) return res.status(401).json({ message: "Unauthorized: no token received" });

    //no need to authenticate type, if it is decoded, this application must have encoded it
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (!decoded) return res.status(401).json({ message: "Unauthorized: invalid token" });

    const user = await Profile.findById(decoded?.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    req.userId = user.id;

    next();
  } catch (error) {
    console.log("Error in protectRoute middleware: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
