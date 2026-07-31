//NOTES: apparently it's best practice to precache the watchersByUser relationship.
// This can have the advantage of reducing initial connection times,
// preventing the need to delete and rebuild the in memory relationship
// and making the design of the rest of the application simpler by not having to pause other
// operations until the watchersByUser relationship has retrieved from the DB and cached in-memory.
// Downside, is you need to guarantee every user relationship is prepopulated regardless of whether the
// user is connected and need that relationship needs to exist.
// My only concern about this approach is mutating the relationship (adding a new watcher to the watched user)
// and ensuring that operation completes before any data is transmitted. Though, if any updates to the cache
// are handled guaranteed to happen before then, it shouldn't be a problem.
// TL;DR using precomputed fanout lists. Heavier, but fast.
// Also, not sure how sustainable doing this in memory is at scale. If I do distributed model, a Redis store might
// be more appropriate.

//In contrast to everything I wrote above, I am going to delete the associated entry for a user when they
// are fully disconnected. Given the scale of this application, I'd rather not have completely unaccounted for
// memory leaks. I considered creating a max list size, but that's going to be annoying to baby sit. For
// now, I'm going to use this approach, once I start deploying separate containers for this I can take the
// approach noted above.

import { io } from "../config/socket";
import { ProfileService } from "../services/profile.service";

//Need to track who to send status updates to whoever their current acquaitances are
type UserId = string;
type Username = string;
type SocketId = string;

type User = { userId: UserId; username: Username };

//type User = {userId: UserId, username: string}

//offline might only reference how the user wishes to appear to others, activeSockets is a more accurate source of truth
//type Presence = "online" | "offline" | "dnd" | "away" | "idle";
type Presence = "online" | "offline";

interface UserPresence {
  activeSockets: Set<SocketId>;
  presence: Presence;
}

// ***********************************************************************************************************************
//WARNING:
//contacts list is based off of a in-memory contacts list that is initially copied from DB, then updated and kept in sync by
// the controllers. Improper uses of these functions may cause stale data and break synchronization with the DB, which is the
// intended source of truth for the fanout list.
// ***********************************************************************************************************************
//The only functions intended for use outside of this file or socketEvents.ts are:
//  getContactsPresence,
//  getContactPresence,
//  onSocketConnect,
//  onSocketDisconnect,

const presenceByUser = new Map<UserId, UserPresence>();
const connectedSockets = new Map<SocketId, UserId>();
//user visibility relationship cache
const watchersByUser = new Map<UserId, Map<UserId, Username>>();

function toSocketsOfId(userId: UserId, event: any, ...args: any[]) {
  const userSockets = presenceByUser.get(userId);
  if (!userSockets || !userSockets.activeSockets.size) return;

  for (const sockId of userSockets.activeSockets) {
    io.to(sockId).emit(event, ...args);
  }
}

function toWatchersOfId(userId: UserId, event: any, ...args: any[]) {
  const userWatchers = watchersByUser.get(userId);
  if (!userWatchers || !watchersByUser.size) return;

  userWatchers.forEach((_, userId) => {
    toSocketsOfId(userId, event, ...args);
  });
}

function upsertPresence(userId: UserId): UserPresence {
  let p = presenceByUser.get(userId);
  if (!p) {
    p = { activeSockets: new Set<SocketId>(), presence: "offline" };
    presenceByUser.set(userId, p);
  }
  return p;
}

//feels like this should resolve to what the presence SHOULD be not do any propigation
function setPresence(userId: UserId, presence: Presence) {
  const p = upsertPresence(userId);
  p.presence = presence;

  toWatchersOfId(userId, "newPresence", presence);
}

async function onSocketConnect(socketId: SocketId, userId: UserId) {
  connectedSockets.set(socketId, userId);

  const p = upsertPresence(userId);
  p.activeSockets.add(socketId);

  const watchedList = watchersByUser.get(userId);
  if (!watchedList) {
    watchersByUser.set(userId, new Map<UserId, Username>());
    const contactList = await ProfileService.getContacts(userId);
    createWatcherList(userId, contactList);
  }

  if (p.presence === "offline") p.presence = "online";

  toWatchersOfId(userId, "newPresence", { userId: userId, presence: p.presence });
}

function onSocketDisconnect(socketId: SocketId) {
  const userId = connectedSockets.get(socketId);
  if (!userId) return;

  connectedSockets.delete(socketId);

  const p = presenceByUser.get(userId);
  if (!p) {
    console.error("userPresence not found, failed to remove user");
    return;
  }

  p.activeSockets.delete(socketId);

  const isOnline = p.activeSockets.size;

  let newPresence: Presence;
  if (isOnline) {
    newPresence = p.presence;
  } else {
    newPresence = "offline";
    removeWatcherList(userId);
  }

  if (p.presence === newPresence) return;
  p.presence = newPresence;

  toWatchersOfId(userId, "newPresence", { userId: userId, presence: newPresence });
}

function addWatcher(contactOwner: User, watchedUserId: UserId) {
  let set = watchersByUser.get(watchedUserId);
  if (!set) {
    console.error("watchedUser Set not found, failed to add watcher");
    return;
  }

  set.set(contactOwner.userId, contactOwner.username);
}

function removeWatcher(contactOwnerId: UserId, watchedUserId: UserId) {
  let set = watchersByUser.get(watchedUserId);
  if (!set) {
    console.error("watchedUser Set not found, failed to remove watcher");
    return;
  }
  set.delete(contactOwnerId);
}

//possibly race condition?
async function createWatcherList(userId: UserId, contactList: User[]) {
  if (!contactList.length) return;

  contactList.forEach((contact) => {
    addWatcher(contact, userId);
  });
}

function removeWatcherList(userId: UserId) {
  let result = watchersByUser.delete(userId);
  if (!result) {
    console.error("watchedUser Set not found, failed to remove Set");
  }
}

//undefined indicates userId (the requesting user) is not online and therefore cannot request other uses presence
//contacts list is based off of a in-memory contacts list that is initially copied from DB, then updated and kept in sync by
// the controllers. Improper uses of these functions may break synchronization with the DB.
function getContactsPresence(
  userId: UserId,
): { userId: UserId; username: Username; presence: Presence }[] | undefined {
  const userWatchers = watchersByUser.get(userId);

  if (!userWatchers) {
    console.log("watchersByUser: user must be online to request contact's presence");
    return;
  }

  //const userIdPresence = new Map<UserId, Presence>();
  const contactIdPresence: { userId: UserId; username: Username; presence: Presence }[] = [];
  userWatchers.forEach((username, userId) => {
    const p = presenceByUser.get(userId);
    const presence: Presence = p && p.presence ? p.presence : "offline";
    contactIdPresence.push({ userId: userId, username: username, presence: presence });
  });

  return contactIdPresence;
}

//undefined indicates userId (the requesting user) is not online and therefore cannot request other uses presence
//the second one shouldn't ever occur and it's be confusing for it to also return undefined
function getContactPresence(
  userId: UserId,
  contactId: UserId,
): { userId: UserId; username: Username; presence: Presence } | undefined {
  const p = presenceByUser.get(contactId);
  const presence: Presence = p && p.presence ? p.presence : "offline";

  const set = watchersByUser.get(userId);

  if (!set) {
    console.log("watchersByUser: user must be online to request contact's presence");
    return;
  }
  let u = set.get(contactId);
  if (!u) {
    console.error("watchersByUser: watcher username not found");
    throw new Error("watchersByUser: watcher username not found");
  }
  return { userId: contactId, username: u, presence: presence };
}

function addContact(user: User, contact: User) {
  //need to check if user is online
  const u = watchersByUser.get(user.userId);
  if (u) {
    u.set(contact.userId, contact.username);
  }

  //need to check if contact is online
  const c = watchersByUser.get(contact.userId);
  if (c) {
    c.set(user.userId, user.username);
  }
}

function removeContact(userId: UserId, contactId: UserId) {
  UserPresence.removeWatcher(userId, contactId);
  UserPresence.removeWatcher(contactId, userId);
}

function isUserConnected(userId: UserId): boolean {
  const userPresence = presenceByUser.get(userId);

  if (userPresence && userPresence.activeSockets.size) {
    return true;
  }
  return false;
}

export const UserPresence = {
  onSocketConnect,
  onSocketDisconnect,
  addWatcher,
  removeWatcher,
  toWatchersOfId,
  toSocketsOfId,
  getContactsPresence,
  getContactPresence,
  addContact,
  removeContact,
};
