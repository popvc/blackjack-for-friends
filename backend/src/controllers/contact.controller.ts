import type { Request, Response } from "express";
import { ContactIdDto } from "../dtos/contact.dto";
import Profile from "../models/profile.schema";
import { errorParamsBody, zodErrorParamsBody } from "../lib/responseMessage";
import mongoose from "mongoose";

//NOTE: messaging is independent from whether someone is added as a contact or not

//$pull from both users' contactsId arrays; the first update's filter doubles as the atomic
//existence check (no separate precheck+mutate — avoids the TOCTOU gap `send` papers over
//with a duplicate-key catch, since there's no unique index backstop for a plain array)
async function removeContact(userId: string, contactId: string): Promise<boolean> {
  try {
    return await mongoose.connection.transaction(async (session) => {
      const user = await Profile.findOneAndUpdate(
        { userId, contactsId: contactId },
        { $pull: { contactsId: contactId } },
      ).session(session);

      if (!user) return false;

      const contact = await Profile.findOneAndUpdate(
        { userId: contactId },
        { $pull: { contactsId: userId } },
      ).session(session);

      //same orphan concern as acceptIncomingRequest: the other profile might no longer exist
      if (!contact) {
        throw new Error("Contact profile not found/updated, contact possibly orphaned");
      }

      return true;
    });
  } catch (e: unknown) {
    throw new Error(`Failed to remove contact`, { cause: e });
  }
}

async function getContacts(userId: string): Promise<string[]> {
  const profile = await Profile.findOne({ userId }).select("contactsId").lean();
  return profile?.contactsId ?? [];
}

export const remove = async (req: Request, res: Response) => {
  try {
    const result = ContactIdDto.safeParse(req.params.id);

    if (!result.success) {
      return res
        .status(400)
        .json(zodErrorParamsBody("Failed to remove contact!", result.error.issues));
    }

    const contactId = result.data;
    const { userId } = req.user;

    if (userId === contactId) {
      return res.status(400).json(
        errorParamsBody("Failed to remove contact!", {
          detail: "Invalid input: cannot remove self as contact",
          pointer: "id",
        }),
      );
    }

    const removeResult = await removeContact(userId, contactId);

    if (!removeResult) {
      return res.status(404).json(
        errorParamsBody("Failed to remove contact!", {
          detail: "Invalid input: contact not found",
          pointer: "id",
        }),
      );
    }

    res.status(200).json({
      message: "Contact removed",
      contact: {
        userId: userId,
        contactId: contactId,
      },
    });
  } catch (e: unknown) {
    console.log("Controller remove error:", e);
    res.status(500).json({ message: "Internal server error!" });
  }
};

export const list = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user;

    const contacts = await getContacts(userId);

    res.status(200).json({
      message: "Contacts retrieved",
      contacts,
    });
  } catch (e: unknown) {
    console.log("Controller request/list error:", e);
    res.status(500).json({ message: "Internal server error!" });
  }
};
