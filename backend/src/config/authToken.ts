import type { Response } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "./env";
import ms from "ms";
import type mongoose from "mongoose";

const {JWT_SECRET, NODE_ENV} = ENV;
const ONE_WEEK = "7d";
const TOKEN_NAME = "jwt"

//hypothetically, if an account is deleted but that account has a valid auth cookie for the account, what happens?
//Probably just a bunch of errors when the account isn't found, but should this be accounted for?
//answer: this appears to be the intrinsic trade-off to stateless session management,
//if credentials need to be revoked and take effect immediately then a stateful or hybrid sytstem is required

// Documentation allows effectively any object, prefering string over ObjectId for standardization
export function generateAuthToken(userId: string, res: Response): Response {
  const token = jwt.sign({ userId }, JWT_SECRET, {
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
