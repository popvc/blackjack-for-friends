import type { Response } from "express";
import jwt from "jsonwebtoken"
import { ENV } from "../config/env";

export const generateToken = (userId: number, res: Response) => {
  const { JWT_SECRET } = ENV;
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const token = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // uses miliseconds: 7 days
    httpOnly: true, // helps against some XSS attacks
    sameSite: "strict", // helps against CSRF attacks
    secure: ENV.NODE_ENV == "development" ? false : true, // determines whether https is required. Can be made dependant on environment
  });

  return token;
};
