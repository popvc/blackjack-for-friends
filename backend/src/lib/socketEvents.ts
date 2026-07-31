//send contact request event to user

import { UserPresence } from "./userPresence";

/*
type ContactRequest = {
    senderId: string;
    recipientId: string;
}
*/

//Might move this somewhere else eventually
/*
enum ContactReqEvent {
  Send = "sendContactReq",
  Accept = "acceptContactReq",
  Reject = "rejectContactReq",
  Cancel = "cancelContactReq",
}
*/
//okay this probably doesn't need a new event type for every action

type User = {
  userId: string;
  username: string;
};

enum ContactReqEvent {
  New = "newContactReq",
  Removed = "removedContactReq",
}

enum ContactEvent {
  New = "newContact",
  Removed = "removedContact",
}

//subId can be a bit confusing, it isn't refering to a watcher, but anyone subscribed to this event type
//I think pubId might cause some issues as technically the server is emitting these events, not whoever submitted it to the server
//but it's a bit of a white lie. This will also be true for presence updates.
// However, chat or play actions to the server in the future the emitter will properly be the publisher, and the subscriber will
// either be the server itself or another user (where the server is just relaying the emitted message)
// My choice of taxonomy might change when we get there, but for now this is good

function sendContactRequest(pubId: string, subId: string) {
  const contactRequest = { senderId: pubId, recipientId: subId };

  UserPresence.toSocketsOfId(subId, ContactReqEvent.New, { contactRequest });
}

function acceptContactRequest(pub: User, sub: User): User {
  UserPresence.addContact(pub.userId, sub.userId);

  const contactRequest = { senderId: sub.userId, recipientId: pub.userId };

  const forPub = UserPresence.getUserPresence(pub);
  const forSub = UserPresence.getUserPresence(sub);

  UserPresence.toSocketsOfId(sub.userId, ContactEvent.New, { contactRequest, newContact: forSub });

  return forPub;
}

function rejectContactRequest(pubId: string, subId: string) {
  const contactRequest = { senderId: subId, recipientId: pubId };

  UserPresence.toSocketsOfId(subId, ContactReqEvent.Removed, { contactRequest });
}

function cancelContactRequest(pubId: string, subId: string) {
  const contactRequest = { senderId: pubId, recipientId: subId };

  UserPresence.toSocketsOfId(subId, ContactReqEvent.Removed, { contactRequest });
}

function removeContact(pubId: string, subId: string) {
  UserPresence.removeContact(pubId, subId);

  UserPresence.toSocketsOfId(subId, ContactEvent.Removed, { contactId: pubId });
}

export const SocketEvent = {
  sendContactRequest,
  acceptContactRequest,
  rejectContactRequest,
  cancelContactRequest,
  removeContact,
};
