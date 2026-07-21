import type { Request, Response } from "express";
import { ContactIdDto } from "../dtos/contact.dto";
import ContactRequest from "../models/contact.schema";
import Profile from "../models/profile.schema";
import { errorParamsBody, zodErrorParamsBody } from "../lib/responseMessage";
import mongoose from "mongoose";

//TODO: Socket push needs to be implemented for all endpoints

//Is there a way to bundle these requests together and send them at once? The round trip cost here seems unnecessary

async function validId(contactId: string): Promise<boolean> {
  const validId = await Profile.findOne({ userId: contactId });
  return validId ? true : false;
}

async function alreadyAdded(userId: string, contactId: string): Promise<boolean> {
  const contact = await Profile.findOne({ userId, contactsId: contactId });
  return contact ? true : false;
}

//not really sure if I can break this down into smaller functions meaingfully
//this needs socket event push
async function acceptIncomingRequest(recipientId: string, senderId: string): Promise<boolean> {
  try {
    return await mongoose.connection.transaction(async (session) => {
      const remove = await ContactRequest.deleteOne({
        $or: [
          { lowId: recipientId, highId: senderId, senderId: senderId },
          { lowId: senderId, highId: recipientId, senderId: senderId },
        ],
      }).session(session);

      if (!remove.deletedCount) return false;

      const user = await Profile.findOneAndUpdate(
        { userId: recipientId },
        { $addToSet: { contactsId: senderId } },
      ).session(session);
      const contact = await Profile.findOneAndUpdate(
        { userId: senderId },
        { $addToSet: { contactsId: recipientId } },
      ).session(session);

      //hypothetically either user might not exist anymore if their account no longer exists
      //this propably needs to be logged, as it means there's an orphaned contact request in the DB
      if (!user || !contact) {
        throw new Error("User(s) not found/updated, request possibly orphaned");
      }

      return true;
    });
  } catch (e: unknown) {
    throw new Error(`Failed to accept contact request`, { cause: e });
  }
}

export const send = async (req: Request, res: Response) => {
  try {
    const result = ContactIdDto.safeParse(req.params.id);

    if (!result.success) {
      return res
        .status(400)
        .json(zodErrorParamsBody("Failed to send request!", result.error.issues));
    }

    const recipientId = result.data;
    const { userId } = req.user;

    if (userId === recipientId) {
      return res.status(400).json(
        errorParamsBody("Failed to send contact request!", {
          detail: "Invalid input: cannot send contact request to self",
          pointer: "id",
        }),
      );
    }

    const [valid, added] = await Promise.all([
      validId(recipientId),
      alreadyAdded(userId, recipientId),
    ]);

    if (!valid) {
      return res.status(404).json(
        errorParamsBody("Failed to send contact request!", {
          detail: "Invalid input: contact id not found",
          pointer: "id",
        }),
      );
    }

    if (added) {
      return res.status(409).json(
        errorParamsBody("Failed to send contact request!", {
          detail: "Invalid input: recipient is already added as a contact",
          pointer: "id",
        }),
      );
    }

    const newContactRequest = new ContactRequest({
      lowId: userId,
      highId: recipientId,
      senderId: userId,
    });

    try {
      await newContactRequest.save();
    } catch (e: unknown) {
      if (e instanceof mongoose.mongo.MongoServerError && e.code === 11000) {
        return res.status(409).json(
          errorParamsBody("Failed to send contact request!", {
            detail: "Invalid input: contact request already exists between users",
            pointer: "id",
          }),
        );
      }
      throw e;
    }

    res.status(201).json({
      message: "Contact request sent",
      contactRequest: {
        senderId: userId,
        recipientId: recipientId,
      },
    });
  } catch (e: unknown) {
    console.log("Controller send error:", e);
    res.status(500).json({ message: "Internal server error!" });
  }
};

export const accept = async (req: Request, res: Response) => {
  try {
    const result = ContactIdDto.safeParse(req.params.id);

    if (!result.success) {
      return res
        .status(400)
        .json(zodErrorParamsBody("Failed to accept request!", result.error.issues));
    }

    const senderId = result.data;
    const { userId } = req.user;

    if (userId === senderId) {
      return res.status(400).json(
        errorParamsBody("Failed to accept contact request!", {
          detail: "Invalid input: cannot accept request from self",
          pointer: "id",
        }),
      );
    }

    const acceptResult = await acceptIncomingRequest(userId, senderId);

    if (!acceptResult) {
      return res.status(404).json(
        errorParamsBody("Failed to accept contact!", {
          detail: "Invalid input: contact request from user not found",
          pointer: "id",
        }),
      );
    }

    res.status(201).json({
      message: "Contact request accepted",
      request: {
        senderId: senderId,
        recipientId: userId,
      },
    });
  } catch (e: unknown) {
    console.log("Controller accept error:", e);
    res.status(500).json({ message: "Internal server error!" });
  }
};

//find outgoing or incoming requests and delete them, then push

//reject (sender can do this as well to 'cancel' the request). Though perhaps it would be better to redirect to a dedicated contact/cancel endpoint
export const reject = async (req: Request, res: Response) => {
  try {
    const result = ContactIdDto.safeParse(req.params.id);

    if (!result.success) {
      return res
        .status(400)
        .json(zodErrorParamsBody("Failed to reject request!", result.error.issues));
    }

    const senderId = result.data;
    const { userId } = req.user;

    if (userId === senderId) {
      return res.status(400).json(
        errorParamsBody("Failed to accept contact request!", {
          detail: "Invalid input: cannot accept request from self",
          pointer: "id",
        }),
      );
    }
  } catch (e: unknown) {
    console.log("Controller reject error:", e);
    res.status(500).json({ message: "Internal server error!" });
  }
};

export const cancel = async (req: Request, res: Response) => {
  try {
  } catch (e: unknown) {
    console.log("Controller cancel error:", e);
    res.status(500).json({ message: "Internal server error!" });
  }
};

//list (for contact requests sent or received) a list of currently added contacts should be handled on login to reduce unnecessary db pings, but that's only necessary on the client end
export const list = async (req: Request, res: Response) => {
  try {
  } catch (e: unknown) {
    console.log("Controller list error:", e);
    res.status(500).json({ message: "Internal server error!" });
  }
};
