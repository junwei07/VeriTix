import { sql } from "drizzle-orm";
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// Users table - linked to Replit Auth (or mock Singpass)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  replitId: text("replit_id").unique(), // For Replit Auth
  username: text("username").unique(), // Made optional/unique as Replit Auth provides email/name
  displayName: text("display_name"),
  email: text("email"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  
  // VeriTix Specific Fields
  singpassId: text("singpass_id").unique(), // Mocked Singpass UUID
  walletAddress: text("wallet_address").unique(), // XRPL Wallet Address
  walletSeedEncrypted: text("wallet_seed_encrypted"), // Encrypted Seed (Custodial)
  createdAt: timestamp("created_at").defaultNow(),
});

// Events / Concerts
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  date: timestamp("date").notNull(),
  imageUrl: text("image_url"),
  price: integer("price").notNull(), // in Cents or Drops
  totalTickets: integer("total_tickets").notNull(),
  availableTickets: integer("available_tickets").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tickets (NFTs)
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(), // Owner
  eventId: integer("event_id").references(() => events.id).notNull(),
  
  // XRPL Data
  nftTokenId: text("nft_token_id"), // The TokenID on XRPL
  status: text("status").notNull().default("active"), // active, used, burned
  
  // Metadata snapshot
  seat: text("seat"),
  purchasePrice: integer("purchase_price"),
  purchaseDate: timestamp("purchase_date").defaultNow(),
});

// === SCHEMAS ===

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });
export const insertTicketSchema = createInsertSchema(tickets).omit({ id: true, purchaseDate: true });

// === TYPES ===

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;

// API Payloads
export type CreateTicketRequest = {
  eventId: number;
  quantity: number;
};

export type TransferTicketRequest = {
  ticketId: number;
  recipientEmail: string; // Identify recipient by email/singpass
};

export type VerifyTicketRequest = {
  ticketId: number;
  signature: string; // The dynamic signature
  timestamp: number;
};

export type QRCodeData = {
  ticketId: number;
  walletAddress: string;
  signature: string;
  timestamp: number;
};
