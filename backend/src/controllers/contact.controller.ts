import type { Request, Response } from "express";
import { AddContactDto } from "../dtos/contact.dto";
import ContactRequest from "../models/contact.schema";
import Profile from "../models/profile.schema";
import { errorBody, zodErrorBody } from "../lib/responseMessage";

//NOTE: messaging is independent from whether someone is added as a contact or not

//TODO: 'send' needs to push to web socket

//Is there a way to bundle these requests together and send them at once? The round trip cost here seems unnecessary

async function validId(contactId: string): Promise<boolean> {
  const validId = await Profile.findOne({ userId: contactId });
  return validId ? true : false;
}

async function alreadyAdded(userId: string, contactId: string): Promise<boolean> {
  const contact = await Profile.findOne({ userId, contactsId: contactId });
  return contact ? true : false;
}

//Checks for both incoming and outgoing requests with other user
async function alreadyRequested(userId: string, contactId: string): Promise<boolean> {
  const exists = await ContactRequest.findOne({
    $or: [
      { lowId: userId, highId: contactId },
      { lowId: contactId, highId: userId },
    ],
  });
  return exists ? true : false;
}

//this needs transactions and push
async function acceptIncomingRequest(recipientId: string, senderId: string): Promise<boolean> {
  const accept = await ContactRequest.deleteOne({
    $or: [
      { lowId: recipientId, highId: senderId, senderId: senderId },
      { lowId: senderId, highId: recipientId, senderId: senderId },
    ],
  });
  return accept.deletedCount ? true : false;
}

async function addContacts(userId: string, contactId: string): Promise<void> {
  await Promise.all([
    Profile.findOneAndUpdate({ userId }, { $addToSet: { contactsId: contactId } }),
    Profile.findOneAndUpdate({ userId: contactId }, { $addToSet: { contactsId: userId } }),
  ]);
}

//use web sockets to enable real-time status between two, optimist UI updates for sender and recipients

export const add = async (req: Request, res: Response) => {
  try {
    //this isn't parsing the body but :id in the URL
    //const result = AddContactDto.safeParse(req.body);
    const result = AddContactDto.safeParse(req.params.id);

    if (!result.success) {
      return res.status(400).json(zodErrorBody("Failed to send request!", result.error.issues));
    }

    const recipientId = result.data;
    const { userId } = req.user;

    if (userId === recipientId) {
      return res.status(400).json(
        errorBody("Failed to send contact request!", {
          detail: "Invalid input: cannot send contact request to self",
          pointer: "params.id",
        }),
      );
    }

    const [valid, added, requested] = await Promise.all([
      validId(recipientId),
      alreadyAdded(userId, recipientId),
      alreadyRequested(userId, recipientId),
    ]);

    if (!valid) {
      return res.status(404).json(
        errorBody("Failed to send contact request!", {
          detail: "Invalid input: contact id not found",
          pointer: "params.id",
        }),
      );
    }

    if (added) {
      return res.status(409).json(
        errorBody("Failed to send contact request!", {
          detail: "Invalid input: recipient is already added as a contact",
          pointer: "params.id",
        }),
      );
    }

    if (requested) {
      return res.status(409).json(
        errorBody("Failed to send contact request!", {
          detail: "Invalid input: contact request already exists between users",
          pointer: "params.id",
        }),
      );
    }

    const newContactRequest = new ContactRequest({
      lowId: userId,
      highId: recipientId,
      senderId: userId,
    });

    await newContactRequest.save();

    res.status(201).json({
      message: "Contact request sent",
      contactRequest: {
        senderId: userId,
        recipientId: recipientId,
      },
    });
  } catch (e: unknown) {
    console.log("Controller add error:", e);
    res.status(500).json({ message: "Internal server error!" });
  }
};

//find incoming request, then add to contacts and push

//200 contact constraint on contact list: cannot send under this condition
//accept (reject: deletes the request; accept: accept them to contact list then deletes the request)
//could potentially just overload this functionality with add
export const accept = async (req: Request, res: Response) => {
  try {
    const result = AddContactDto.safeParse(req.params.id);

    if (!result.success) {
      return res.status(400).json(zodErrorBody("Failed to accept request!", result.error.issues));
    }

    const senderId = result.data;
    const { userId } = req.user;

    if (userId === senderId) {
      return res.status(400).json(
        errorBody("Failed to accept contact request!", {
          detail: "Invalid input: cannot accept request from self",
          pointer: "params.id",
        }),
      );
    }

    const acceptResult = await acceptIncomingRequest(userId, senderId);

    if (!acceptResult) {
      return res.status(404).json(
        errorBody("Failed to accept contact!", {
          detail: "Invalid input: contact request from user not found",
          pointer: "params.id",
        }),
      );
    }

    await addContacts(userId, senderId);

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

//reject (sender can do this as well to 'cancel' the request)
export const reject = async (req: Request, res: Response) => {
  try {
  } catch (e: unknown) {
    console.log("Controller reject error:", e);
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
