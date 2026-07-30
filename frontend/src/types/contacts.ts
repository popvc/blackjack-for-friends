export type UserId = string;

export type ContactTab = "contacts" | "requests";

export type ContactRequest = {
  senderId: UserId;
  recipientId: UserId;
};

export type Presence = "online" | "offline";

export type UserPresence = { userId: UserId; presence: Presence };

export type ContactReq = { senderId: UserId; recipientId: UserId };

export interface PresenceData {
  message: string;
  contactsPresence: UserPresence[];
}

export interface ContactRequestData {
  message: string;
  contactRequest: ContactRequest;
}

export interface ContactRequestsListData {
  message: string;
  contactRequests: ContactRequest[];
}
