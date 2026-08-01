import { PresenceRegistry } from "./presenceRegistry";
type Presence = "offline" | "online";
type User = {
  userId: string;
  username: string;
};

enum ContactEvent {
  Presence = "newPresence",
  New = "newContact",
  Removed = "removedContact",
}

enum ContactReqEvent {
  New = "newContactReq",
  Removed = "removedContactReq",
}

//***************************************************************************************************************
//WARNING: This module doesn't just distribute events, it updates the state of the PresenceRegistry module.
//***************************************************************************************************************

//***************************************************************************************************************
//WARNING: This module doesn't just distribute events, it updates the state of the PresenceRegistry module.
//***************************************************************************************************************

//subId can be a bit confusing from the perspective of the PresenceRegistry, it isn't refering to a watcher, but anyone subscribed to 
// this event type I think pubId might cause some issues as technically the server is emitting these events, not whoever submitted it 
// to the server but it's a bit of a white lie. This will also be true for presence updates.
// However, chat or play actions to the server in the future the emitter will properly be the publisher, and the subscriber will
// either be the server itself or another user (where the server is just relaying the emitted message)
// My choice of taxonomy might change when we get there, but for now this is good

function newPresence(pubId: string, presence: Presence) {
  PresenceRegistry.setPresence(pubId, ContactEvent.Presence, presence);
}

function removeContact(pubId: string, subId: string) {
  PresenceRegistry.removeContact(pubId, subId);

  PresenceRegistry.toSocketsOfId(subId, ContactEvent.Removed, { contactId: pubId });
  PresenceRegistry.toSocketsOfId(pubId, ContactEvent.Removed, { contactId: subId });
}

function sendContactRequest(pub: User, sub: User) {
  const contactRequest = {
    senderId: pub.userId,
    recipientId: sub.userId,
    senderName: pub.username,
    recipientName: sub.username,
  };

  PresenceRegistry.toSocketsOfId(sub.userId, ContactReqEvent.New, { contactRequest });
  PresenceRegistry.toSocketsOfId(pub.userId, ContactReqEvent.New, { contactRequest });
}

function acceptContactRequest(pub: User, sub: User) {
  PresenceRegistry.addContact(pub.userId, sub.userId);

  const contactRequest = { senderId: sub.userId, recipientId: pub.userId };

  const pubPresence = PresenceRegistry.getUserPresence(pub);
  const subPresence = PresenceRegistry.getUserPresence(sub);

  PresenceRegistry.toSocketsOfId(sub.userId, ContactReqEvent.Removed, { contactRequest });
  PresenceRegistry.toSocketsOfId(pub.userId, ContactReqEvent.Removed, { contactRequest });
  PresenceRegistry.toSocketsOfId(sub.userId, ContactEvent.New, { newContact: pubPresence });
  PresenceRegistry.toSocketsOfId(pub.userId, ContactEvent.New, { newContact: subPresence });
}

function rejectContactRequest(pubId: string, subId: string) {
  const contactRequest = { senderId: subId, recipientId: pubId };

  PresenceRegistry.toSocketsOfId(subId, ContactReqEvent.Removed, { contactRequest });
  PresenceRegistry.toSocketsOfId(pubId, ContactReqEvent.Removed, { contactRequest });
}

function cancelContactRequest(pubId: string, subId: string) {
  const contactRequest = { senderId: pubId, recipientId: subId };

  PresenceRegistry.toSocketsOfId(subId, ContactReqEvent.Removed, { contactRequest });
  PresenceRegistry.toSocketsOfId(pubId, ContactReqEvent.Removed, { contactRequest });
}
export const SocketEvent = {
  newPresence,
  removeContact,
  sendContactRequest,
  acceptContactRequest,
  rejectContactRequest,
  cancelContactRequest,
};
