export type UserId = string;

export type ContactTab = "contacts" | "requests";

export type ContactRequest = {
  senderId: UserId;
  recipientId: UserId;
};

export type Presence = "online" | "offline";

export type UserPresence = { userId: UserId; presence: Presence };

export type Contact = { userId: UserId; username: string; presence: Presence };

export type ContactReq = { senderId: UserId; recipientId: UserId };

export interface PresenceData {
  message: string;
  contactsPresence: UserPresence[];
}

export interface ContactsListData {
  message: string;
  contacts: { userId: UserId; username: string }[];
}

export interface ContactRequestData {
  message: string;
  contactRequest: ContactRequest;
}

export interface ContactRequestsListData {
  message: string;
  contactRequests: ContactRequest[];
}

export interface ServerToClientEvents {
  newContactReq: (data: { contactRequest: ContactRequest }) => void;
  removedContactReq: (data: { contactRequest: ContactRequest }) => void;
  newContact: (data: { contactRequest: ContactRequest }) => void;
  removedContact: (data: { contactId: UserId }) => void;
  newPresence: (data: UserPresence) => void;
}
