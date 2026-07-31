export type UserId = string;

export type ContactTab = "contacts" | "requests";

export type ContactRequest = {
  senderId: UserId;
  recipientId: UserId;
  //only populated by GET /contact/request/list — send/accept/reject/cancel responses and socket events don't carry it
  senderName?: string;
};

export type Presence = "online" | "offline";

export type UserPresence = { userId: UserId; presence: Presence };

export type Contact = { userId: UserId; username: string; presence: Presence };

export type ContactReq = { senderId: UserId; recipientId: UserId };

export interface PresenceData {
  message: string;
  contactsPresence: Contact[];
}

export interface ContactRequestData {
  message: string;
  contactRequest: ContactRequest;
  newContact?: Contact;
}

export interface ContactRequestsListData {
  message: string;
  contactRequests: ContactRequest[];
}

export interface ServerToClientEvents {
  newContactReq: (data: { contactRequest: ContactRequest }) => void;
  removedContactReq: (data: { contactRequest: ContactRequest }) => void;
  newContact: (data: { contactRequest: ContactRequest; newContact: Contact }) => void;
  removedContact: (data: { contactId: UserId }) => void;
  newPresence: (data: UserPresence) => void;
}
