import type { Response } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "./env";
import ms from "ms";
import Profile, { type IProfile } from "../models/profile.schema";

const { JWT_SECRET, NODE_ENV } = ENV;
const ONE_WEEK = "7d";
const TOKEN_NAME = "jwt";

//Move this somewhere more appropriate later and give it a better name, UserInfo?
export type AuthUser = Pick<IProfile, "userId" | "username" | "email">;

//if credentials need to be revoked and take effect immediately then a stateful or hybrid sytstem is required

// Documentation allows effectively any object, prefering string over ObjectId for standardization
export function generateAuthToken(payload: AuthUser, res: Response): Response {
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: ONE_WEEK,
  });

  return res.cookie(TOKEN_NAME, token, {
    maxAge: ms(ONE_WEEK), // uses miliseconds
    httpOnly: true, // better protection against XSS attacks
    sameSite: "strict", // better protection against CSRF attacks
    secure: NODE_ENV === "development" ? false : true, // determines whether https is required
  });
}

//stateless token authentication: does NOT guarantee token expiry
export function expireToken(res: Response): Response {
  return res.cookie(TOKEN_NAME, "", { maxAge: 0 });
}

//verify token
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    //no need to authenticate type, if it is successfully decoded, this application must have encoded it
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    if (!decoded) return null;

    //checks if user still exists
    const user = await Profile.findOne({ userId: decoded.userId }).select("-password");
    if (!user) return null;

    return decoded;
  } catch (e: unknown) {
    throw new Error(`Failed to verify token`, { cause: e});
  }
}
