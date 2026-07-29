//send contact request event to user

import { UserPresence } from "./userPresence";

/*
type ContactRequest = {
    senderId: string;
    recipientId: string;
}
*/

// should I do emit.sendContactRequest() or something?

//Might move this somewhere else eventually
enum ContactReqEvent {
  Send = "sendContactReq",
  Accept = "acceptContactReq",
  Reject = "rejectContactReq",
  Cancel = "cancelContactReq",
}

enum ContactEvent {
  Remove = "removeContact",
}

function sendContactRequest(senderId: string, recipientId: string) {
  UserPresence.toSocketsOfId(recipientId, ContactReqEvent.Send, { senderId, recipientId });
}

function acceptContactRequest(senderId: string, recipientId: string) {
  //needs to add both parties to each others watched lists
  UserPresence.toSocketsOfId(senderId, ContactReqEvent.Accept, { senderId, recipientId });
}

function rejectContactRequest(senderId: string, recipientId: string) {
  UserPresence.toSocketsOfId(senderId, ContactReqEvent.Reject, { senderId, recipientId });
}

function cancelContactRequest(senderId: string, recipientId: string) {
  UserPresence.toSocketsOfId(senderId, ContactReqEvent.Cancel, { senderId, recipientId });
}

function removeContact(senderId: string, recipientId: string) {
  //needs to remove both parties from each others watched lists
  UserPresence.toSocketsOfId(recipientId, ContactEvent.Remove, { senderId, recipientId });
}

export const SocketEvent = {
  sendContactRequest,
  acceptContactRequest,
  rejectContactRequest,
  cancelContactRequest,
  removeContact,
};
