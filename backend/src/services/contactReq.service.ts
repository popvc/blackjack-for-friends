import mongoose from "mongoose";
import ContactRequest from "../models/contactRequest.schema";
import Profile from "../models/profile.schema";
import { AppError } from "../lib/errors";

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
  username: string,
): Promise<{ senderId: string; recipientId: string; senderName: string; recipientName: string }[]> {
  const requests = await ContactRequest.find({
    $or: [{ lowId: userId }, { highId: userId }],
  }).lean();

  if (!requests.length) return [];

  //need to create list of ids to look up so their usernames can be fetched from db
  const otherIdList = requests.map(({ lowId, highId }) => (userId === lowId ? highId : lowId));

  //sent request to fetch usernames
  const userInfo = await Profile.find({ userId: { $in: otherIdList } }, { username: 1 })
    .select("userId username -_id")
    .lean();

  //really just a fail early
  if (userInfo.length !== requests.length) {
    throw new AppError(500, "Contact Request profile not found, contact possibly orphaned", false);
  }

  const userInfoMap = new Map<string, string>(
    userInfo.map(({ userId, username }) => [userId, username]),
  );

  //senderId is always one of lowId/highId; recipientId is whichever one it isn't
  return requests.map(({ lowId, highId, senderId }) => {
    const recipientId: string = senderId === lowId ? highId : lowId;

    const otherId: string = senderId === userId ? recipientId : senderId;

    const otherName: string | undefined = userInfoMap.get(otherId);

    if (!otherName) {
      throw new AppError(
        500,
        "Other Contact Request profile not found, contact possibly orphaned",
        false,
      );
    }

    return senderId === userId
      ? {
          senderId,
          recipientId,
          senderName: username,
          recipientName: otherName,
        }
      : {
          senderId,
          recipientId,
          senderName: otherName,
          recipientName: username,
        };
  });
}

async function createContactRequest(senderId: string, recipientId: string): Promise<boolean> {
  const newContactRequest = new ContactRequest({
    lowId: senderId,
    highId: recipientId,
    senderId,
  });

  try {
    await newContactRequest.save();
  } catch (e: unknown) {
    if (e instanceof mongoose.mongo.MongoServerError && e.code === 11000) {
      return false;
    }
    throw e;
  }

  return true;
}

export const ContactReqService = {
  acceptContactRequest,
  deleteContactRequest,
  getContactRequests,
  createContactRequest,
};
