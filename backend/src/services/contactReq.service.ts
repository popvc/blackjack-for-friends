import mongoose from "mongoose";
import ContactRequest from "../models/contactRequest.schema";
import Profile from "../models/profile.schema";
import { AppError } from "../lib/errors";
import { accept } from "../controllers/contactRequest.controller";

//not really sure if I can break this down into smaller functions meaingfully
//this needs socket event push
async function acceptContactRequest(senderId: string, recipientId: string): Promise<boolean> {
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
      throw new AppError(500, "User(s) not found/updated, request possibly orphaned", false);
    }

    return true;
  });
}

async function deleteContactRequest(senderId: string, recipientId: string): Promise<boolean> {
  const remove = await ContactRequest.deleteOne({
    $or: [
      { lowId: senderId, highId: recipientId, senderId },
      { lowId: recipientId, highId: senderId, senderId },
    ],
  });

  return remove.deletedCount > 0;
}

async function getContactRequests(
  userId: string,
): Promise<{ senderId: string; recipientId: string }[]> {
  const requests = await ContactRequest.find({
    $or: [{ lowId: userId }, { highId: userId }],
  }).lean();

  //senderId is always one of lowId/highId; recipientId is whichever one it isn't
  return requests.map(({ lowId, highId, senderId }) => ({
    senderId,
    recipientId: senderId === lowId ? highId : lowId,
  }));
}

export const ContactReqService = { acceptContactRequest, deleteContactRequest, getContactRequests };
