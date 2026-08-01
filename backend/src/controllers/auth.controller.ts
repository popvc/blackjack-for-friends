import type { Request, Response } from "express";

import Profile from "../models/profile.schema";
import bcrypt from "bcryptjs";
import { expireToken, generateAuthToken, type AuthUser } from "../config/authToken";
import { customAlphabet } from "nanoid";
import { CreateProfileDto, LoginProfileDto } from "../dtos/auth.dto";
import { errorBodyBody, zodErrorBodyBody } from "../lib/responseMessage";
import { ProfileService } from "../services/profile.service";

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}

function generateUserId(): string {
  const nanoid = customAlphabet("1234567890", 20);
  return nanoid();
}

export const signup = async (req: Request, res: Response) => {
  //const createProfile: CreateProfile = req.body;

  const result = CreateProfileDto.safeParse(req.body);

  //return properly formatted errors
  if (!result.success) {
    return res
      .status(400)
      .json(zodErrorBodyBody("Failed to create new profile!", result.error.issues));
  }

  const { username, email, password } = result.data;

  const [usernameIsUnique, emailIsUnique] = await Promise.all([
    ProfileService.isUniqueEmail(email),
    ProfileService.isUniqueUsername(username),
  ]);

  if (!emailIsUnique) {
    return res.status(409).json(
      errorBodyBody("Failed to create new profile!", {
        detail: "Invalid input: must be unique, already in use!",
        pointer: "email",
      }),
    );
  }

  if (!usernameIsUnique) {
    return res.status(409).json(
      errorBodyBody("Failed to create new profile!", {
        detail: "Invalid input: must be unique, already in use!",
        pointer: "username",
      }),
    );
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

  const payload: AuthUser = { userId, username, email };
  res = generateAuthToken(payload, res);

  res.status(201).json({
    message: "New profile successfully created and signed in",
    user: { userId, username: username, email: email },
  });
};

//if token is being sent but is still invalid, should I invalidate it? Could be a client local time issue preventing expiry
export const signin = async (req: Request, res: Response) => {
  const checkToken = req.cookies.jwt;

  const result = LoginProfileDto.safeParse(req.body);

  if (!result.success) {
    return res.status(401).json(zodErrorBodyBody("Sign in failed!", result.error.issues));
  }

  const { email, password } = result.data;
  const profile = await ProfileService.checkCredentials(email, password);

  //Returning only a message breaks with established convention,
  //However the alternative is either specifying both failed, which is misleading
  if (!profile)
    return res.status(401).json(
      errorBodyBody("Sign in failed!", {
        detail: "Invalid credentials!",
        pointer: "#",
      }),
    );

  //if user has non-expired token, prevents unnecessary token generation
  if (checkToken && profile) {
    return res.status(200).json({ message: "Signed in", user: profile });
  }

  const payload: AuthUser = profile;
  res = generateAuthToken(payload, res);

  res.status(200).json({
    message: "Signed in",
    user: profile,
  });
};

export const signout = async (_: Request, res: Response) => {
  res = expireToken(res);
  res.status(200).json({ message: "Signed out" });
};
