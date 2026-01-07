import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./replit_integrations/auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import * as crypto from 'crypto';

// Simple XRPL mock for the MVP to avoid heavy dependencies if not needed yet
// We generate keys locally using crypto for the "Custodial Wallet" simulation
function generateWallet() {
  const seed = crypto.randomBytes(32).toString('hex');
  const address = 'r' + crypto.createHash('sha256').update(seed).digest('hex').substring(0, 33);
  return { seed, address };
}

function signData(data: string, seed: string) {
  // Mock signing
  return crypto.createHmac('sha256', seed).update(data).digest('hex');
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Set up Replit Auth
  setupAuth(app);

  // Helper to ensure user is authenticated
  const requireAuth = (req: Request, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // --- API Routes ---

  app.get(api.auth.me.path, requireAuth, async (req, res) => {
    // When user hits /me, we ensure they have a wallet
    if (!req.user) return res.sendStatus(401);
    
    const user = await storage.getUser(req.user.id);
    if (!user) return res.sendStatus(404);

    if (!user.walletAddress) {
      // "Upon first login... create a new Custodial XRPL Wallet"
      const { seed, address } = generateWallet();
      const updatedUser = await storage.updateUserWallet(user.id, address, seed); // storing seed plain for MVP mock, normally encrypt!
      return res.json(updatedUser);
    }

    res.json(user);
  });

  app.get(api.events.list.path, async (req, res) => {
    const events = await storage.getEvents();
    res.json(events);
  });

  app.get(api.events.get.path, async (req, res) => {
    const event = await storage.getEvent(Number(req.params.id));
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  });

  app.get(api.tickets.list.path, requireAuth, async (req, res) => {
    const tickets = await storage.getTicketsByUserId(req.user!.id);
    // Filter out burned tickets
    const activeTickets = tickets.filter(t => t.status === 'active');
    res.json(activeTickets);
  });

  app.post(api.tickets.purchase.path, requireAuth, async (req, res) => {
    const input = api.tickets.purchase.input.parse(req.body);
    const event = await storage.getEvent(input.eventId);
    
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.availableTickets <= 0) return res.status(400).json({ message: "Sold out" });

    // Mock Payment & Minting
    const ticket = await storage.createTicket({
      userId: req.user!.id,
      eventId: event.id,
      nftTokenId: `xrpl_token_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      status: 'active',
      seat: `Section A, Row ${Math.floor(Math.random() * 20)}, Seat ${Math.floor(Math.random() * 50)}`,
      purchasePrice: event.price,
    });

    res.status(201).json(ticket);
  });

  app.get(api.tickets.get.path, requireAuth, async (req, res) => {
    const ticket = await storage.getTicket(Number(req.params.id));
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    if (ticket.userId !== req.user!.id) return res.status(403).json({ message: "Not your ticket" });
    
    res.json(ticket);
  });

  app.get(api.tickets.generateQR.path, requireAuth, async (req, res) => {
    const ticketId = Number(req.params.id);
    const ticket = await storage.getTicket(ticketId);
    
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    if (ticket.userId !== req.user!.id) return res.status(403).json({ message: "Not your ticket" });

    const user = await storage.getUser(req.user!.id);
    if (!user || !user.walletSeedEncrypted) return res.status(500).json({ message: "Wallet error" });

    // "Dynamic QR: ... Signed Token (wallet_signature + timestamp)"
    const timestamp = Date.now();
    const dataToSign = `${ticket.nftTokenId}:${timestamp}`;
    const signature = signData(dataToSign, user.walletSeedEncrypted); // Mock signing

    res.json({
      ticketId,
      walletAddress: user.walletAddress,
      signature,
      timestamp
    });
  });

  app.post(api.tickets.transfer.path, requireAuth, async (req, res) => {
    const { ticketId, recipientUsername } = api.tickets.transfer.input.parse(req.body);
    
    const ticket = await storage.getTicket(ticketId);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    if (ticket.userId !== req.user!.id) return res.status(403).json({ message: "Not your ticket" });
    if (ticket.status !== 'active') return res.status(400).json({ message: "Ticket not active" });

    const recipient = await storage.getUserByUsername(recipientUsername);
    if (!recipient) return res.status(404).json({ message: "Recipient not found" });

    const newTicket = await storage.transferTicket(ticketId, recipient.id);
    
    res.json({ success: true, newTicketId: newTicket.id });
  });

  await seedDatabase();

  return httpServer;
}

export async function seedDatabase() {
    const events = await storage.getEvents();
    if (events.length === 0) {
        await storage.createEvent({
            title: "Taylor Swift | The Eras Tour",
            description: "The Eras Tour is the ongoing sixth headlining concert tour by American singer-songwriter Taylor Swift.",
            location: "National Stadium, Singapore",
            date: new Date("2026-03-01T19:00:00"),
            price: 20000, // 200.00
            totalTickets: 50000,
            availableTickets: 500,
            imageUrl: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&q=80&w=1000",
        });

        await storage.createEvent({
            title: "Coldplay: Music of the Spheres",
            description: "Music of the Spheres World Tour is the eighth concert tour by British rock band Coldplay.",
            location: "National Stadium, Singapore",
            date: new Date("2026-04-15T20:00:00"),
            price: 18000, // 180.00
            totalTickets: 40000,
            availableTickets: 1200,
            imageUrl: "https://images.unsplash.com/photo-1470229722913-7ea051c24efc?auto=format&fit=crop&q=80&w=1000",
        });
        
        await storage.createEvent({
            title: "Formula 1 Singapore Grand Prix",
            description: "The original night race. Experience the thrill of F1 under the lights.",
            location: "Marina Bay Street Circuit",
            date: new Date("2026-09-20T20:00:00"),
            price: 50000, // 500.00
            totalTickets: 10000,
            availableTickets: 50,
            imageUrl: "https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?auto=format&fit=crop&q=80&w=1000",
        });
    }
}
