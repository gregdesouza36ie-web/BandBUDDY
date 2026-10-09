import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing the Manus OAuth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const bands = mysqlTable("bands", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Band = typeof bands.$inferSelect;
export type InsertBand = typeof bands.$inferInsert;

export const bandMembers = mysqlTable(
  "band_members",
  {
    id: int("id").autoincrement().primaryKey(),
    bandId: int("bandId").notNull(),
    userId: int("userId").notNull(),
    role: mysqlEnum("role", ["owner", "member"]).default("member").notNull(),
    lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    bandUserUnique: uniqueIndex("band_members_band_user_unique").on(table.bandId, table.userId),
  })
);

export type BandMember = typeof bandMembers.$inferSelect;
export type InsertBandMember = typeof bandMembers.$inferInsert;

export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  bandId: int("bandId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  venue: varchar("venue", { length: 160 }),
  eventDate: timestamp("eventDate"),
  status: mysqlEnum("status", ["draft", "ready", "archived"]).default("draft").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

export const eventMembers = mysqlTable(
  "event_members",
  {
    id: int("id").autoincrement().primaryKey(),
    eventId: int("eventId").notNull(),
    userId: int("userId").notNull(),
    role: mysqlEnum("role", ["editor", "viewer"]).default("editor").notNull(),
    invitedAt: timestamp("invitedAt").defaultNow().notNull(),
    acceptedAt: timestamp("acceptedAt"),
  },
  table => ({
    eventUserUnique: uniqueIndex("event_members_event_user_unique").on(table.eventId, table.userId),
  })
);

export type EventMember = typeof eventMembers.$inferSelect;
export type InsertEventMember = typeof eventMembers.$inferInsert;

export const songs = mysqlTable("songs", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  position: int("position").default(0).notNull(),
  setName: varchar("setName", { length: 16 }).default("Set A").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  artist: varchar("artist", { length: 160 }),
  videoUrl: text("videoUrl"),
  sourceKey: varchar("sourceKey", { length: 12 }),
  singerKey: varchar("singerKey", { length: 12 }),
  keyStatus: mysqlEnum("keyStatus", ["pending", "detected", "unavailable"]).default("pending").notNull(),
  durationSeconds: int("durationSeconds"),
  createdBy: int("createdBy").notNull(),
  updatedBy: int("updatedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Song = typeof songs.$inferSelect;
export type InsertSong = typeof songs.$inferInsert;

export const activity = mysqlTable("activity", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 80 }).notNull(),
  detail: text("detail"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Activity = typeof activity.$inferSelect;
export type InsertActivity = typeof activity.$inferInsert;
