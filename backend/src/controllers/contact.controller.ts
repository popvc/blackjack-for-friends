import type { Request, Response } from "express";
import { AddContactDto } from "../dtos/contact.dto";
import ContactRequest from "../models/contact.schema";
import Profile from "../models/profile.schema";

async function alreadyAdded(userId: string, contactId: string): Promise<boolean> {
  const contact = await Profile.findOne({ userId, contactsId: contactId });
  return contact ? true : false;
}

//looks for out going or ingoing request with other user, prevents users from filling up DB with duplicate requests
async function duplicateRequest(userId: string, contactId: string): Promise<boolean> {
  const request = await ContactRequest.find({ senderId: userId, receipientId: contactId });
  console.log("request", request);
  return request.length ? true : false;
}

//TODO (contacts):
//players need contacts list field
//need to search by player ID or name (exact match)
//need to hold sent requests in own collection ContactRequests (id, time, sender, receipient)
//will display on both until resolved
//users need to be able to accept or reject messages (determines whether deleted from db)

//use web sockets to enable real-time status between two, optimist UI updates for sender and receipients

//note: messaging is independent from whether someone is added as a contact or not

//TODO: add needs to push to web socket

//200 contact constraint on contact list: cannot accept under this condition
//add (checks if already added, checks if has already received request from user and accepts if so. Otherwise sends request to user and they must accept or reject itt)
//Is this doing too much?
export const add = async (req: Request, res: Response) => {
  try {
    //this isn't parsing the body but :id in the URL
    //const result = AddContactDto.safeParse(req.body);
    const result = AddContactDto.safeParse(req.params.id);

    if (!result.success) {
      return res.status(400).json({
        message: "Failed to send request!",
        errors: result.error.issues.map((issue) => {
          return { detail: issue.message, pointer: issue.path[0] };
        }),
      });
    }

    const receipient = result.data;
    const { userId } = req;

    if (await alreadyAdded(userId, receipient)) {
      return res.status(409).json({
        message: "Failed to add contact!",
        errors: [
          { detail: "Invalid input: receipient is already a contact", pointer: "params.id" },
        ],
      });
    }

    if (await duplicateRequest(userId, receipient)) {
      return res.status(409).json({
        message: "Failed to add contact!",
        errors: [
          {
            detail: "Invalid input: duplicate outgoing contact add request to user",
            pointer: "params.id",
          },
        ],
      });
    }
    console.log("something?");

    const newContactRequest = new ContactRequest({
      senderId: userId,
      receipientId: receipient,
    });

    await newContactRequest.save();

    res.status(201).json({
      message: "Add contact request successfuly sent!",
      addContact: {
        senderId: userId,
        receipientId: receipient,
      },
    });
  } catch (e: unknown) {
    console.log("Controller add error:", e);
    res.status(500).json({ message: "Internal server error!" });
  }
};

//200 contact constraint on contact list: cannot send under this condition
//accept (reject: deletes the request; accept: accept them to contact list then deletes the request)
//could potentially just overload this functionality with add
export const accept = async (req: Request, res: Response) => {
  try {
  } catch (e: unknown) {
    console.log("Controller accept error:", e);
    res.status(500).json({ message: "Internal server error!" });
  }
};

//reject (sender can do this as well to 'cancel' the request)

//list (for contact requests sent or received) a list of currently added contacts should be handled on login to reduce unnecessary db pings, but that's only necessary on the client end
