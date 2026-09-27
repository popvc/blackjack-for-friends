export type UserId = string;

export type ContactTab = "contacts" | "requests";

//!!!shouldn't rely on comment to communicate this here, there should just be a different type
// or better yet inferred for a response DTO in backend (doesn't exist yet, but soon)
export type ContactRequest = {
  senderId: UserId;
  recipientId: UserId;
  //populated by GET /contact/request/list, POST /contact/request/:id/send's response, and the
  //newContactReq socket event; not present on accept/reject/cancel responses or other socket events
  senderName: string;
  recipientName: string;
};

export type Presence = "online" | "offline";

export type UserPresence = { userId: UserId; presence: Presence };

export type Contact = { userId: UserId; username: string; presence: Presence };

export interface PresenceData {
  message: string;
  contactsPresence: Contact[];
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
  newContact: (data: { newContact: Contact }) => void;
  removedContact: (data: { contactId: UserId }) => void;
  newPresence: (data: UserPresence) => void;
}
