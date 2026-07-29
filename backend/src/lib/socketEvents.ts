import { toSocketsOfId } from "./userPresence";

//send contact request event to user

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

export function sendContactRequest(senderId: string, recipientId: string) {
  toSocketsOfId(recipientId, ContactReqEvent.Send, { senderId, recipientId });
}

export function acceptContactRequest(senderId: string, recipientId: string) {
  toSocketsOfId(senderId, ContactReqEvent.Accept, { senderId, recipientId });
}

export function rejectContactRequest(senderId: string, recipientId: string) {
  toSocketsOfId(senderId, ContactReqEvent.Reject, { senderId, recipientId });
}

export function cancelContactRequest(senderId: string, recipientId: string) {
  toSocketsOfId(senderId, ContactReqEvent.Cancel, { senderId, recipientId });
}

