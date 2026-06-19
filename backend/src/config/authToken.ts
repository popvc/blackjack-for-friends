import type { Response } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "./env";
import ms from "ms";
import Profile from "../models/profile.schema";

const { JWT_SECRET, NODE_ENV } = ENV;
const ONE_WEEK = "7d";
const TOKEN_NAME = "jwt";

//Move this somewhere more appropriate later, also this accidentally overloads a "jsonwebtoken"
export interface TokenPayload {
  userId: string;
}

//hypothetically, if an account is deleted but that account has a valid auth cookie for the account, what happens?
//Probably just a bunch of errors when the account isn't found, but should this be accounted for?
//answer: this appears to be the intrinsic trade-off to stateless session management,
//if credentials need to be revoked and take effect immediately then a stateful or hybrid sytstem is required

// Documentation allows effectively any object, prefering string over ObjectId for standardization
export function generateAuthToken(payload: TokenPayload, res: Response): Response {
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

//stateless token authentication: DOES NOT guarantee token expiry
export function expireToken(res: Response): Response {
  return res.cookie(TOKEN_NAME, "", { maxAge: 0 });
}

//verify token
export async function verifyToken(token: any): Promise<string | null> {
  try {
    //no need to authenticate type, if it is decoded, this application must have encoded it
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    if (!decoded) return null;

    //checks if user still exists
    const user = await Profile.findOne({ userId: decoded.userId }).select("-password");
    if (!user) return null;

    return user.userId;
  } catch (e: any) {
    throw `Failed to verify token: ${e.message}`;
  }
}
