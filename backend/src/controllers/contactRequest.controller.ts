import { type Request, type Response } from "express";
import { ContactIdDto } from "../dtos/contact.dto";
import ContactRequest from "../models/contactRequest.schema";
import { errorParamsBody, zodErrorParamsBody } from "../lib/responseMessage";
import mongoose from "mongoose";
import { ContactReqService } from "../services/contactReq.service";
import { ProfileService } from "../services/profile.service";
import { SocketEvent } from "../lib/socketEvents";

export const send = async (req: Request, res: Response) => {
  const result = ContactIdDto.safeParse(req.params.id);

  if (!result.success) {
    return res.status(400).json(zodErrorParamsBody("Failed to send request!", result.error.issues));
  }

  const recipientId = result.data;
  const senderId = req.user.userId;
  const senderName = req.user.username;

  if (senderId === recipientId) {
    return res.status(400).json(
      errorParamsBody("Failed to send contact request!", {
        detail: "Invalid input: cannot send contact request to self",
        pointer: "id",
      }),
    );
  }

  const [recipientName, added] = await Promise.all([
    ProfileService.getUsername(recipientId),
    ProfileService.isContactAdded(senderId, recipientId),
  ]);

  if (!recipientName) {
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
    lowId: senderId,
    highId: recipientId,
    senderId: senderId,
    senderName: senderName,
    recipientName: recipientName,
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

  SocketEvent.sendContactRequest(
    { userId: senderId, username: senderName },
    { userId: recipientId, username: recipientName },
  );

  res.status(201).json({
    message: "Contact request sent",
    contactRequest: {
      senderId: senderId,
      recipientId: recipientId,
      senderName: senderName,
      recipientName: recipientName,
    },
  });
};

export const accept = async (req: Request, res: Response) => {
  const result = ContactIdDto.safeParse(req.params.id);

  if (!result.success) {
    return res
      .status(400)
      .json(zodErrorParamsBody("Failed to accept request!", result.error.issues));
  }

  const senderId = result.data;
  const recipientId = req.user.userId;
  const recipientName = req.user.username;

  if (recipientId === senderId) {
    return res.status(400).json(
      errorParamsBody("Failed to accept contact request!", {
        detail: "Invalid input: cannot accept request from self",
        pointer: "id",
      }),
    );
  }

  const acceptResult = await ContactReqService.acceptContactRequest(senderId, recipientId);

  if (!acceptResult) {
    return res.status(404).json(
      errorParamsBody("Failed to accept contact!", {
        detail: "Invalid input: contact request from user not found",
        pointer: "id",
      }),
    );
  }

  const senderName = await ProfileService.getUsername(senderId);

  //this would only trigger on the unlikely race condition where the sender of the request deletes their account
  // right as another user accepts a friend request from them.
  // I'm just going to throw an error for now. Worst case is, after the request is accepted
  // (which deletes it; not a problem, was going to happen anyways) then http 500 error triggers a refresh for whomever accepted it.
  // The server deletes the contact from the accepting user's DB contactslist before any update to the UI can happen. No one is the wiser.
  // It would make more sense to return a 404, not going to for now.
  // Fixing this still wouldn't fix the stale UI if the account was deleted or changed their name AFTER getUsername is called successfully
  // but that's what the regular contact presence refreshes are for.
  if (!senderName) {
    throw new Error(
      "ContactRequest Accept controller: could not find sender's username after successful request",
    );
  }

  const newContact = SocketEvent.acceptContactRequest(
    { userId: recipientId, username: recipientName },
    { userId: senderId, username: senderName },
  );

  res.status(201).json({
    message: "Contact request accepted",
    contactRequest: {
      senderId: senderId,
      recipientId: recipientId,
    },
    newContact,
  });
};

export const reject = async (req: Request, res: Response) => {
  const result = ContactIdDto.safeParse(req.params.id);

  if (!result.success) {
    return res
      .status(400)
      .json(zodErrorParamsBody("Failed to reject request!", result.error.issues));
  }

  const senderId = result.data;
  const recipientId = req.user.userId;

  if (recipientId === senderId) {
    return res.status(400).json(
      errorParamsBody("Failed to reject contact request!", {
        detail: "Invalid input: cannot reject request from self",
        pointer: "id",
      }),
    );
  }

  const deleted = await ContactReqService.deleteContactRequest(senderId, recipientId);

  if (!deleted) {
    return res.status(404).json(
      errorParamsBody("Failed to reject contact request!", {
        detail: "Invalid input: contact request from user not found",
        pointer: "id",
      }),
    );
  }

  SocketEvent.rejectContactRequest(recipientId, senderId);

  res.status(200).json({
    message: "Contact request rejected",
    contactRequest: {
      senderId: senderId,
      recipientId: recipientId,
    },
  });
};

export const cancel = async (req: Request, res: Response) => {
  const result = ContactIdDto.safeParse(req.params.id);

  if (!result.success) {
    return res
      .status(400)
      .json(zodErrorParamsBody("Failed to cancel request!", result.error.issues));
  }

  const recipientId = result.data;
  const senderId = req.user.userId;

  if (senderId === recipientId) {
    return res.status(400).json(
      errorParamsBody("Failed to cancel contact request!", {
        detail: "Invalid input: cannot cancel request to self",
        pointer: "id",
      }),
    );
  }

  const deleted = await ContactReqService.deleteContactRequest(senderId, recipientId);

  if (!deleted) {
    return res.status(404).json(
      errorParamsBody("Failed to cancel contact request!", {
        detail: "Invalid input: contact request to user not found",
        pointer: "id",
      }),
    );
  }

  SocketEvent.cancelContactRequest(senderId, recipientId);

  res.status(200).json({
    message: "Contact request cancelled",
    contactRequest: {
      senderId: senderId,
      recipientId: recipientId,
    },
  });
};

//list (for contact requests sent or received) a list of currently added contacts should be handled on login to reduce unnecessary db pings, but that's only necessary on the client end
export const list = async (req: Request, res: Response) => {
  const { userId } = req.user;

  const requests = await ContactReqService.getContactRequests(userId);

  res.status(200).json({
    message: "Contact requests retrieved",
    contactRequests: requests ? requests : [],
  });
};
