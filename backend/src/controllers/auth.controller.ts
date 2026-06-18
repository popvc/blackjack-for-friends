import type { Request, Response } from "express";

import { ENV } from "../config/env";
import z from "zod";
import Profile from "../models/profile.schema";
import bcrypt from "bcryptjs";
import { expireToken, generateAuthToken } from "../config/authToken";
import type mongoose from "mongoose";
import type { HydratedDocument } from "mongoose";

// Lowercase, a-z, 0-9, underscores. No consecutive, leading or trailing underscores.
const VALID_USERNAME_REGEX = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;

//Todo:
//signup
//signin
//logout
//update
//authcheck

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

async function checkCredentials(email: string, password: string): Promise<string | null> {
  const profile = await Profile.findOne({ email });

  if (!profile || !profile.password) {
    return null;
  }

  //return await bcrypt.compare(password, profile.password);
  if (await bcrypt.compare(password, profile.password)) {
    return profile._id.toString();
  }

  return null;
}

const CreateProfile = z.object({
  password: z.string().min(16).max(64),
  username: z
    .stringFormat("username", VALID_USERNAME_REGEX, {
      error:
        "Invalid input: Can only use lowercase a-z, 0-9 or underscore. No leading, trailing or consecutive underscores",
    })
    .min(6)
    .max(36),
  email: z.email().toLowerCase(),
});

const LoginProfile = z.object({
  email: z.string(),
  password: z.string(),
});

type CreateProfile = z.infer<typeof CreateProfile>;

type LoginProfile = z.infer<typeof LoginProfile>;

export const signup = async (req: Request, res: Response) => {
  //const createProfile: CreateProfile = req.body;

  try {
    const result = CreateProfile.safeParse(req.body);

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

    console.log("password", password);

    const hashedPassword = await hashPassword(password);

    console.log("hashedPassword", hashedPassword);

    const garbage = " somethingasdfsdafa";
    const aNumber = 123123123;

    //should I not just use create?

    //there's got to be a better way of doing this...
    const newProfile =
      new Profile({

      });

    console.log("profile", newProfile);

    await newProfile.save();

    /*
    await Profile.create({username, email, password: hashedPassword})
    */

    res.status(201).json({
      message: "New profile successfully created",
      profile: { username: username, email: email },
    });
  } catch (e) {
    //will need proper logging system eventually
    console.log("Controller signup error: ", e);
    res.status(500).json({ message: "Internal server error!" });
  }
};

//login
export const login = async (req: Request, res: Response) => {
  const result = LoginProfile.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Login failed!",
      errors: result.error.issues.map((issue) => {
        return { detail: issue.message, pointer: issue.path[0] };
      }),
    });
  }

  const { email, password } = result.data;

  try {
    const userId = await checkCredentials(email, password);
    if (!userId) return res.status(400).json({ message: "Invalid credentials" });

    res = generateAuthToken(userId, res);

    res.status(200).json({
      message: "Login successful",
      profile: {
        email: email,
      },
    });
  } catch (e) {
    console.error("Controller login error: ", e);
    res.status(500).json({ message: "Internal server error!" });
  }
};

//logout
export const logout = async (req: Request, res: Response) => {
  res = expireToken(res);
  res.status(200).json({ message: "Log out successful" });
};
