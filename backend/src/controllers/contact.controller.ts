import type { Request, Response } from "express";
import { AddContactDto } from "../dtos/contact.dto";
import ContactRequest from "../models/contact.schema";
import Profile from "../models/profile.schema";
import { errorBody, zodErrorBody } from "../lib/responseMessage";

//NOTICE: race conditions can likely be handled in the DB schema itself

//WARNING: currently, these controllers do very little to account for race conditions

//TODO: actually make functions for responses, current approach takes up too much space
//TODO: setup postman to automatically handle a lot of these test cases, or better yet do them in bun tester

//TODO: 'send' needs to push to web socket
//TODO: 'send' needs to account for race conditions (two users sending requests to one another simultaneously)

//TODO: duplicateRequest needs to confirm there isn't an incoming request as well. This must be handled as part of a transaction to handle race conditions.

//Is there a way to bundle these requests together and send them at once? The round trip cost here seems unnecessary

//check if the desired contact id exists and if it's the same as user id
async function contactExists(userId: string, contactId: string): Promise<boolean> {
  const validId = await Profile.findOne({ userId });
  return validId ? true : false;
}

async function alreadyAdded(userId: string, contactId: string): Promise<boolean> {
  const contact = await Profile.findOne({ userId, contactsId: contactId });
  return contact ? true : false;
}

//looks for out going or ingoing request with other user, prevents users from filling up DB with duplicate requests
async function duplicateRequest(userId: string, contactId: string): Promise<boolean> {
  const duplicate = await ContactRequest.find({ senderId: userId, recipientId: contactId });
  return duplicate.length ? true : false;
}

//this needs transactions and push
async function acceptIncomingRequest(userId: string, contactId: string): Promise<boolean> {
  const accept = await ContactRequest.deleteOne({ senderId: contactId, recipientId: userId });
  return accept.deletedCount ? true : false;
}

//TODO (contacts):
//players need contacts list field
//need to search by player ID or name (exact match)
//need to hold sent requests in own collection ContactRequests (id, time, sender, recipient)
//will display on both until resolved
//users need to be able to accept or reject messages (determines whether deleted from db)

//use web sockets to enable real-time status between two, optimist UI updates for sender and recipients

//note: messaging is independent from whether someone is added as a contact or not

export const send = async (req: Request, res: Response) => {
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
          detail: "Invalid input: contact sender cannot be recipient",
          pointer: "params.id",
        }),
      );
    }

    if (!(await contactExists(userId, recipientId))) {
      return res.status(404).json(
        errorBody("Failed to send contact request!", {
          detail: "Invalid input: contact id not found",
          pointer: "params.id",
        }),
      );
    }

    if (await alreadyAdded(userId, recipientId)) {
      return res.status(409).json(
        errorBody("Failed to send contact request!", {
          detail: "Invalid input: recipient is already a contact",
          pointer: "params.id",
        }),
      );
    }

    if (await duplicateRequest(userId, recipientId)) {
      return res.status(409).json(
        errorBody("Failed to send contact request!", {
          detail: "Invalid input: duplicate outgoing add request to user",
          pointer: "params.id",
        }),
      );
    }

    const newContactRequest = new ContactRequest({
      senderId: userId,
      recipientId: recipientId,
    });

    await newContactRequest.save();

    res.status(201).json({
      message: "Contact request sent",
      request: {
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
  const result = AddContactDto.safeParse(req.params.id);

  if (!result.success) {
    return res.status(400).json(zodErrorBody("Failed to accept request!", result.error.issues));
  }

  const senderId = result.data;
  const { userId } = req.user;

  const acceptResult = await acceptIncomingRequest(userId, senderId);

  if (!acceptResult) {
    return res.status(404).json(
      errorBody("Failed to accept contact!", {
        detail: "Invalid input: no add request from user found",
        pointer: "params.id",
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

  try {
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
