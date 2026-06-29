import type { Request, Response } from "express";

import Profile from "../models/profile.schema";
import bcrypt from "bcryptjs";
import { expireToken, generateAuthToken, type TokenPayload } from "../config/authToken";
import { customAlphabet } from "nanoid";
import { CreateProfileDto, LoginProfileDto } from "../dtos/auth.dto";

async function uniqueEmail(email: string): Promise<boolean> {
  const profile = await Profile.findOne({ email });
  return profile ? false : true;
}

async function uniqueUsername(username: string): Promise<boolean> {
  const profile = await Profile.findOne({ username });
  return profile ? false : true;
}

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}

function generateUserId(): string {
  const nanoid = customAlphabet("1234567890", 20);
  return nanoid();
}

async function checkCredentials(email: string, password: string): Promise<string | null> {
  try {
    const profile = await Profile.findOne({ email });

    if (!profile || !profile.password) {
      return null;
    }

    //return await bcrypt.compare(password, profile.password);
    if (await bcrypt.compare(password, profile.password)) {
      return profile.userId;
    }

    return null;
  } catch (e: unknown) {
    throw `Failed to authenticate credentials:${e}`;
  }
}

export const signup = async (req: Request, res: Response) => {
  //const createProfile: CreateProfile = req.body;

  try {
    const result = CreateProfileDto.safeParse(req.body);

    //return properly formatted errors
    if (!result.success) {
      return res.status(400).json({
        message: "Failed to create new profile!",
        errors: result.error.issues.map((issue) => {
          return { detail: issue.message, pointer: issue.path[0] };
        }),
      });
    }

    const { username, email, password } = result.data;

    if (!(await uniqueEmail(email))) {
      return res.status(400).json({
        message: "Failed to create new profile!",
        errors: [{ detail: "Invalid input: must be unique, already in use", pointer: "email" }],
      });
    }

    if (!(await uniqueUsername(username))) {
      return res.status(400).json({
        message: "Failed to create new profile!",
        errors: [{ detail: "Invalid input: must be unique, already in use", pointer: "username" }],
      });
    }

    const hashedPassword = await hashPassword(password);
    const userId = generateUserId();

    //should I not just use create?
    //await Profile.create({username, email, password: hashedPassword})
    //Why isn't there strict type checking for the input object?
    const newProfile = new Profile({
      userId,
      username,
      email,
      password: hashedPassword,
    });

    await newProfile.save();

    res.status(201).json({
      message: "New profile successfully created and signed i",
      profile: { userId, username: username, email: email },
    });
  } catch (e: unknown) {
    //will need proper logging system eventually
    console.log("Controller signup error:", e);
    res.status(500).json({ message: "Internal server error!" });
  }
};

//login response is inconsistent with signup response
//if token is being sent but is still invalid, should I invalidate it? Could be a client local time issue preventing expiry
//login
export const signin = async (req: Request, res: Response) => {
  const checkToken = req.cookies.jwt;

  try {
    const result = LoginProfileDto.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Sign in failed!",
        errors: result.error.issues.map((issue) => {
          return { detail: issue.message, pointer: issue.path[0] };
        }),
      });
    }

    const { email, password } = result.data;
    const userId = await checkCredentials(email, password);

    if (!userId) return res.status(400).json({ message: "Invalid credentials" });

    //if user has non-expired token, prevents unnecessary token generation
    if (checkToken && userId) {
      return res.status(200).json({ message: "Signed in", profile: { userId } });
    }

    const payload: TokenPayload = { userId };
    res = generateAuthToken(payload, res);

    res.status(200).json({
      message: "Signed in",
      profile: { userId },
    });
  } catch (e: unknown) {
    console.error("Controller signin error:", e);
    res.status(500).json({ message: "Internal server error!" });
  }
};

//logout
export const signout = async (_: Request, res: Response) => {
  res = expireToken(res);
  res.status(200).json({ message: "Signed out" });
};
