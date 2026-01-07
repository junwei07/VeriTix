import { db } from "./db";
import {
  users, events, tickets,
  type User, type InsertUser,
  type Event, type InsertEvent,
  type Ticket, type InsertTicket
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByReplitId(replitId: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserWallet(userId: string, address: string, encryptedSeed: string): Promise<User>;

  // Events
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;

  // Tickets
  getTicketsByUserId(userId: string): Promise<(Ticket & { event: Event })[]>;
  getTicket(id: number): Promise<(Ticket & { event: Event }) | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicketStatus(id: number, status: string): Promise<Ticket>;
  transferTicket(ticketId: number, newUserId: string): Promise<Ticket>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByReplitId(replitId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.replitId, replitId));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserWallet(userId: string, address: string, encryptedSeed: string): Promise<User> {
    const [user] = await db.update(users)
      .set({ walletAddress: address, walletSeedEncrypted: encryptedSeed })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getEvents(): Promise<Event[]> {
    return await db.select().from(events);
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async getTicketsByUserId(userId: string): Promise<(Ticket & { event: Event })[]> {
    const results = await db.select()
      .from(tickets)
      .innerJoin(events, eq(tickets.eventId, events.id))
      .where(eq(tickets.userId, userId));
    
    return results.map(r => ({ ...r.tickets, event: r.events }));
  }

  async getTicket(id: number): Promise<(Ticket & { event: Event }) | undefined> {
    const [result] = await db.select()
      .from(tickets)
      .innerJoin(events, eq(tickets.eventId, events.id))
      .where(eq(tickets.id, id));
    
    if (!result) return undefined;
    return { ...result.tickets, event: result.events };
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const [newTicket] = await db.insert(tickets).values(ticket).returning();
    return newTicket;
  }

  async updateTicketStatus(id: number, status: string): Promise<Ticket> {
    const [updated] = await db.update(tickets)
      .set({ status })
      .where(eq(tickets.id, id))
      .returning();
    return updated;
  }

  async transferTicket(ticketId: number, newUserId: string): Promise<Ticket> {
    // In a real blockchain scenario, we would burn and mint.
    // Here we just reassign ownership for simplicity in the MVP, 
    // OR we could mark old as burned and create new.
    // Let's reassign for now to keep history simple, or follow the "managed flow" strictly?
    // "Backend executes NFTokenBurn (destroys User A's ticket). Backend executes NFTokenMint (creates new ticket for User B)."
    
    // Let's actually simulate that:
    // 1. Mark old ticket as 'burned'
    // 2. Create new ticket for new user
    
    // Transactional?
    return await db.transaction(async (tx) => {
        const [oldTicket] = await tx.select().from(tickets).where(eq(tickets.id, ticketId));
        if (!oldTicket) throw new Error("Ticket not found");

        await tx.update(tickets).set({ status: 'burned' }).where(eq(tickets.id, ticketId));
        
        const [newTicket] = await tx.insert(tickets).values({
            ...oldTicket,
            id: undefined, // New ID
            userId: newUserId,
            status: 'active',
            nftTokenId: 'simulated_new_token_' + Date.now(),
            purchaseDate: new Date(), // Re-mint date
        }).returning();
        
        return newTicket;
    });
  }
}

export const storage = new DatabaseStorage();
