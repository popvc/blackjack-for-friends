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

//need to rename this module something more descriptive like EventRouter or SocketFanout

import { io } from "../config/socket";
import { ProfileService } from "../services/profile.service";
import { SocketEvent } from "./socketEvents";

//Need to track who to send status updates to whoever their current acquaitances are
type UserId = string;
type SocketId = string;
type User = { userId: UserId; username: string };

//offline might only reference how the user wishes to appear to others, activeSockets is a more accurate source of truth
//type Presence = "online" | "offline" | "dnd" | "away" | "idle";
type Presence = "online" | "offline";

interface UserPresence {
  activeSockets: Set<SocketId>;
  presence: Presence;
}

const presenceByUser = new Map<UserId, UserPresence>();
const connectedSockets = new Map<SocketId, UserId>();
//user visibility relationship cache
const watchersByUser = new Map<UserId, Set<UserId>>();

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

  for (const watcherId of userWatchers) {
    toSocketsOfId(watcherId, event, ...args);
  }
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
function setPresence(userId: UserId, event: string, presence: Presence) {
  const p = upsertPresence(userId);
  
  //if there's no change, no point doing unnecessary lookups
  if (p.presence === presence) return;
  p.presence = presence;

  toWatchersOfId(userId, event, presence);
}

async function onSocketConnect(socketId: SocketId, userId: UserId) {
  connectedSockets.set(socketId, userId);

  const p = upsertPresence(userId);

  p.activeSockets.add(socketId);

  const watchedList = watchersByUser.get(userId);
  if (!watchedList) {
    watchersByUser.set(userId, new Set<UserId>());
    const contactList = await ProfileService.getContactIds(userId);
    createWatcherList(userId, contactList);
  }

  SocketEvent.newPresence(userId, "online");
}

function onSocketDisconnect(socketId: SocketId) {
  console.log("starting presence disconnected");
  const userId = connectedSockets.get(socketId);
  if (!userId) {
    console.error("connectedSocket not found, failed to remove socket");
    return;
  }

  connectedSockets.delete(socketId);

  const p = presenceByUser.get(userId);
  if (!p) {
    console.error("userPresence not found, failed to remove user");
    return;
  }

  p.activeSockets.delete(socketId);

  const isOnline = p.activeSockets.size;

  let newPresence: Presence = p.presence;
  if (!isOnline) {
    newPresence = "offline";
    removeWatcherList(userId);
  }

  SocketEvent.newPresence(userId, newPresence);
}

function addWatcher(contactOwnerId: UserId, watchedUserId: UserId) {
  let set = watchersByUser.get(watchedUserId);
  if (!set) {
    console.error("watchedUser Set not found, failed to add watcher");
    return;
  }

  set.add(contactOwnerId);
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
async function createWatcherList(userId: UserId, contactList: UserId[]) {
  if (!contactList.length) return;

  contactList.forEach((contactId) => {
    addWatcher(contactId, userId);
  });
}

function removeWatcherList(userId: UserId) {
  let result = watchersByUser.delete(userId);
  if (!result) {
    console.error("watchedUser Set not found, failed to delete");
  }
}

//Source of truth is based on in-memory watcher list, not DB
function getAllUserPresence(
  usersId: User[],
): { userId: UserId; username: string; presence: Presence }[] | undefined {
  if (!usersId.length) return;

  //const userIdPresence = new Map<UserId, Presence>();
  const contactPresence: { userId: UserId; username: string; presence: Presence }[] = [];
  usersId.forEach((user) => {
    const p = presenceByUser.get(user.userId);
    const presence: Presence = p && p.presence ? p.presence : "offline";
    contactPresence.push({
      userId: user.userId,
      username: user.username,
      presence: presence,
    });
  });

  return contactPresence;
}

function getUserPresence(user: User): { userId: UserId; username: string; presence: Presence } {
  const p = presenceByUser.get(user.userId);
  const presence: Presence = p && p.presence ? p.presence : "offline";
  return { userId: user.userId, username: user.username, presence: presence };
}

function addContact(userId: UserId, contactId: UserId) {
  //need to check if user is online
  const u = watchersByUser.get(userId);
  if (u) {
    u.add(contactId);
  }

  //need to check if contact is online
  const c = watchersByUser.get(contactId);
  if (c) {
    c.add(userId);
  }
}

function removeContact(userId: UserId, contactId: UserId) {
  PresenceRegistry.removeWatcher(userId, contactId);
  PresenceRegistry.removeWatcher(contactId, userId);
}

function isUserConnected(userId: UserId): boolean {
  const userPresence = presenceByUser.get(userId);

  if (userPresence && userPresence.activeSockets.size) {
    return true;
  }
  return false;
}

export const PresenceRegistry = {
  onSocketConnect,
  onSocketDisconnect,
  getAllUserPresence,
  getUserPresence,
  setPresence,
  removeContact,
  addContact,
  addWatcher,
  removeWatcher,
  toWatchersOfId,
  toSocketsOfId,
};
