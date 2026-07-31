import type { Request, Response } from "express";
import { ContactIdDto } from "../dtos/contact.dto";
import { errorParamsBody, zodErrorParamsBody } from "../lib/responseMessage";
import { ProfileService } from "../services/profile.service";
import { SocketEvent } from "../lib/socketEvents";
import { UserPresence } from "../lib/userPresence";

//NOTE: messaging should be independent from whether someone is added as a contact or not

export const remove = async (req: Request, res: Response) => {
  const result = ContactIdDto.safeParse(req.params.id);

  if (!result.success) {
    return res
      .status(400)
      .json(zodErrorParamsBody("Failed to remove contact!", result.error.issues));
  }

  const contactId = result.data;
  const userId = req.user.userId;

  if (userId === contactId) {
    return res.status(400).json(
      errorParamsBody("Failed to remove contact!", {
        detail: "Invalid input: cannot remove self as contact",
        pointer: "id",
      }),
    );
  }

  const removeResult = await ProfileService.removeContact(userId, contactId);

  if (!removeResult) {
    return res.status(404).json(
      errorParamsBody("Failed to remove contact!", {
        detail: "Invalid input: contact not found",
        pointer: "id",
      }),
    );
  }

  SocketEvent.removeContact(userId, contactId);

  res.status(200).json({
    message: "Contact removed",
    contactId: contactId,
  });
};

export const list = async (req: Request, res: Response) => {
  const { userId } = req.user;

  const contacts = await ProfileService.getContacts(userId);

  res.status(200).json({
    message: "Contacts retrieved",
    contacts,
  });
};

export const presence = async (req: Request, res: Response) => {
  const { userId } = req.user;

  const contactIds = await ProfileService.getContacts(userId);

  const contactsPresence = UserPresence.getAllUserPresence(contactIds);

  res
    .status(200)
    .json({
      message: "Contacts presence retrieved",
      contactsPresence: contactsPresence ? contactsPresence : [],
    });
};

//need to retrieve a list of all contacts details on first connection, names and presence especially.
