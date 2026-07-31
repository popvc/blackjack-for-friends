//$pull from both users' contactsId arrays; the first update's filter doubles as the atomic
//existence check (no separate precheck+mutate — avoids the TOCTOU gap `send` papers over

import mongoose from "mongoose";
import Profile from "../models/profile.schema";
import { AppError } from "../lib/errors";
import type { AuthUser } from "../config/authToken";
import bcrypt from "bcryptjs";

async function isUniqueEmail(email: string): Promise<boolean> {
  const profile = await Profile.findOne({ email });
  return profile ? false : true;
}

async function isUniqueUsername(username: string): Promise<boolean> {
  const profile = await Profile.findOne({ username });
  return profile ? false : true;
}

async function isValidId(contactId: string): Promise<boolean> {
  const isValidId = await Profile.findOne({ userId: contactId });
  return isValidId ? true : false;
}

async function isContactAdded(userId: string, contactId: string): Promise<boolean> {
  const contact = await Profile.findOne({ userId, contactsId: contactId });
  return contact ? true : false;
}

async function checkCredentials(email: string, password: string): Promise<AuthUser | null> {
  try {
    const profile = await Profile.findOne({ email });

    if (!profile || !profile.password) {
      return null;
    }

    //return await bcrypt.compare(password, profile.password);
    if (await bcrypt.compare(password, profile.password)) {
      return {
        userId: profile.userId,
        username: profile.username,
        email: profile.email,
      } as AuthUser;
    }

    return null;
  } catch (e: unknown) {
    throw `Failed to authenticate credentials:${e}`;
  }
}

//with a duplicate-key catch, since there's no unique index backstop for a plain array)
async function removeContact(senderId: string, recipientId: string): Promise<boolean> {
  return await mongoose.connection.transaction(async (session) => {
    const user = await Profile.findOneAndUpdate(
      { userId: senderId, contactsId: recipientId },
      { $pull: { contactsId: recipientId } },
    ).session(session);

    if (!user) return false;

    const contact = await Profile.findOneAndUpdate(
      { userId: recipientId },
      { $pull: { contactsId: senderId } },
    ).session(session);

    //same orphan concern as acceptIncomingRequest: the other profile might no longer exist
    if (!contact) {
      throw new AppError(
        500,
        "Contact profile not found/updated, contact possibly orphaned",
        false,
      );
    }

    return true;
  });
}

async function getContactIds(userId: string): Promise<string[]> {
  const profile = await Profile.findOne({ userId }).select("contactsId").lean();
  return profile?.contactsId ?? [];
}

async function getContacts(userId: string): Promise<{ userId: string; username: string }[]> {
  const contactsId = await getContactIds(userId);

  if (!contactsId.length) return [];

  return await Profile.find({ userId: { $in: contactsId } })
    .select("userId username -_id")
    .lean();
}

async function getUsername(userId: string): Promise<string | undefined> {
  const profile = await Profile.findOne({ userId: userId }).select("username");
  return profile && profile?.username ? profile.username : undefined;
}

export const ProfileService = {
  isUniqueEmail,
  isUniqueUsername,
  isValidId,
  isContactAdded,
  checkCredentials,
  getContactIds,
  removeContact,
  getContacts,
  getUsername,
};
