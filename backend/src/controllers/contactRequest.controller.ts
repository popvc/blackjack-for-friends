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

  if (senderId === recipientId) {
    return res.status(400).json(
      errorParamsBody("Failed to send contact request!", {
        detail: "Invalid input: cannot send contact request to self",
        pointer: "id",
      }),
    );
  }

  const [valid, added] = await Promise.all([
    ProfileService.isValidId(recipientId),
    ProfileService.isContactAdded(senderId, recipientId),
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
    lowId: senderId,
    highId: recipientId,
    senderId: senderId,
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

  SocketEvent.sendContactRequest(senderId, recipientId);

  res.status(201).json({
    message: "Contact request sent",
    contactRequest: {
      senderId: senderId,
      recipientId: recipientId,
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

  if (recipientId === senderId) {
    return res.status(400).json(
      errorParamsBody("Failed to accept contact request!", {
        detail: "Invalid input: cannot accept request from self",
        pointer: "id",
      }),
    );
  }

  const acceptResult = await ContactReqService.acceptContactRequest(recipientId, senderId);

  if (!acceptResult) {
    return res.status(404).json(
      errorParamsBody("Failed to accept contact!", {
        detail: "Invalid input: contact request from user not found",
        pointer: "id",
      }),
    );
  }

  SocketEvent.acceptContactRequest(senderId, recipientId);

  res.status(201).json({
    message: "Contact request accepted",
    request: {
      senderId: senderId,
      recipientId: recipientId,
    },
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

  SocketEvent.rejectContactRequest(senderId, recipientId);

  res.status(200).json({
    message: "Contact request rejected",
    request: {
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
    request: {
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
    requests: requests,
  });
};
