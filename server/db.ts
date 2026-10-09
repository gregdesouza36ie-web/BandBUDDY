import { and, asc, desc, eq, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  activity,
  bands,
  eventMembers,
  eventInvites,
  events,
  InsertActivity,
  InsertEventInvite,
  InsertSong,
  InsertUser,
  songs,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];

  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listEventsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ event: events, band: bands })
    .from(events)
    .leftJoin(bands, eq(events.bandId, bands.id))
    .leftJoin(eventMembers, eq(events.id, eventMembers.eventId))
    .where(or(eq(events.createdBy, userId), eq(eventMembers.userId, userId)))
    .orderBy(desc(events.eventDate), desc(events.updatedAt));
}

export async function getEventWorkspace(eventId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const eventResult = await db
    .select({ event: events, band: bands })
    .from(events)
    .leftJoin(bands, eq(events.bandId, bands.id))
    .leftJoin(eventMembers, eq(events.id, eventMembers.eventId))
    .where(and(eq(events.id, eventId), or(eq(events.createdBy, userId), eq(eventMembers.userId, userId))))
    .limit(1);
  if (!eventResult[0]) return null;

  const eventSongs = await db
    .select()
    .from(songs)
    .where(eq(songs.eventId, eventId))
    .orderBy(asc(songs.position));
  const recentActivity = await db
    .select()
    .from(activity)
    .where(eq(activity.eventId, eventId))
    .orderBy(desc(activity.createdAt))
    .limit(20);
  return { ...eventResult[0], songs: eventSongs, activity: recentActivity };
}

export async function createEventSong(song: InsertSong) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(songs).values(song);
  return result[0].insertId;
}

export async function updateEventSong(songId: number, eventId: number, values: Partial<InsertSong>) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(songs).set(values).where(and(eq(songs.id, songId), eq(songs.eventId, eventId)));
}

export async function deleteEventSong(songId: number, eventId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(songs).where(and(eq(songs.id, songId), eq(songs.eventId, eventId)));
}

export async function recordActivity(entry: InsertActivity) {
  const db = await getDb();
  if (!db) return;
  await db.insert(activity).values(entry);
}

export async function listEventInvites(eventId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(eventInvites).where(eq(eventInvites.eventId, eventId)).orderBy(desc(eventInvites.createdAt));
}

export async function isEventOwner(eventId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ id: events.id }).from(events).where(and(eq(events.id, eventId), eq(events.createdBy, userId))).limit(1);
  return Boolean(result[0]);
}

export async function createEventInvite(invite: InsertEventInvite) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select().from(eventInvites).where(and(eq(eventInvites.eventId, invite.eventId), eq(eventInvites.email, invite.email))).limit(1);
  if (existing[0]) {
    await db.update(eventInvites).set({ role: invite.role, status: "pending", invitedBy: invite.invitedBy }).where(eq(eventInvites.id, existing[0].id));
    return existing[0].id;
  }
  const result = await db.insert(eventInvites).values(invite);
  return result[0].insertId;
}

export async function acceptEventInvite(inviteId: number, userId: number, email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const invite = await db.select().from(eventInvites).where(and(eq(eventInvites.id, inviteId), eq(eventInvites.email, email), eq(eventInvites.status, "pending"))).limit(1);
  if (!invite[0]) return false;
  await db.insert(eventMembers).values({ eventId: invite[0].eventId, userId, role: invite[0].role }).onDuplicateKeyUpdate({ set: { role: invite[0].role } });
  await db.update(eventInvites).set({ status: "accepted", acceptedAt: new Date() }).where(eq(eventInvites.id, inviteId));
  return true;
}
