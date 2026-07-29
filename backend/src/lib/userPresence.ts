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

import { io } from "../config/socket";

//Need to track who to send status updates to whoever their current acquaitances are
type UserId = string;
type SocketId = string;

//offline might only reference how the user wishes to appear to others, activeSockets is probably a more accurate source of truth 
//type Presence = "online" | "offline" | "dnd" | "away" | "idle";
type Presence = "online" | "offline";

//still need dedupe versioning, compound of date-time and incremental number

//enum SocketMessage {}
type SocketMessage = "newPresence";

//relatives refers to anyone
interface UserPresence {
  activeSockets: Set<SocketId>;
  presence: Presence;
}

const presenceByUser = new Map<UserId, UserPresence>();
const connectedSockets = new Map<SocketId, UserId>();
//user visibility relationship cache
const watchersByUser = new Map<UserId, Set<UserId>>();

export function toSocketsOfId(userId: UserId, event: any, ...args: any[]) {
  const userSockets = presenceByUser.get(userId);
  if (!userSockets || !userSockets.activeSockets.size) return;

  for (const sockId of userSockets.activeSockets) {
    io.to(sockId).emit(event, ...args);
  }
}

function toWatchersOfId(userId: UserId, event: any, ...args: any[]) {
  const userWatchers = watchersByUser.get(userId);
  if (!userWatchers || watchersByUser.size) return;

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
export function setPresence(userId: UserId, presence: Presence) {
  const p = upsertPresence(userId);
  p.presence = presence;

  toWatchersOfId(userId, "newPresence", presence);
}

export function onSocketConnect(socketId: SocketId, userId: UserId) {
  connectedSockets.set(socketId, userId);

  const p = upsertPresence(userId);
  p.activeSockets.add(socketId);

  if (p.presence === "offline") p.presence = "online";

  toWatchersOfId(userId, "newPresence", p.presence);
}

export function onSocketDisconnect(socketId: SocketId) {
  const userId = connectedSockets.get(socketId);
  if (!userId) return;

  connectedSockets.delete(socketId);

  const p = presenceByUser.get(userId);
  if (!p) return;

  p.activeSockets.delete(socketId);

  const newPresence: Presence = p.activeSockets.size === 0 ? "offline" : p.presence;

  if (p.presence === newPresence) return;
  p.presence = newPresence;

  toWatchersOfId(userId, "newPresence", newPresence);
}

export function addWatcher(contactOwnerId: UserId, watchedUserId: UserId) {
  let set = watchersByUser.get(watchedUserId);
  if (!set) {
    set = new Set<UserId>();
    watchersByUser.set(watchedUserId, set);
  }
  set.add(contactOwnerId);
}

export function isUserConnected(userId: UserId): boolean {
  const userPresence = presenceByUser.get(userId);

  if(userPresence && userPresence.activeSockets.size){
    return true;
  }
  return false;
}