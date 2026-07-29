export type Presence = "online" | "offline";

export type UserPresence = { userId: string; presence: Presence };

export interface PresenceData {
  contactsPresence: UserPresence[];
}
