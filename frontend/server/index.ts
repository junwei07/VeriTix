import express from "express";
import { createServer as createViteServer } from "vite";
import type { ViteDevServer } from "vite";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { readFile } from "fs/promises";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ============================================================================
// MOCK DATA STORE
// ============================================================================

const mockUser = {
  id: "mock-user-1",
  email: "demo@veritix.sg",
  firstName: "Demo",
  lastName: "User",
  profileImageUrl: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockEvents = [
  {
    id: 1,
    title: "Taylor Swift | The Eras Tour",
    description:
      "The Eras Tour is the ongoing sixth headlining concert tour by American singer-songwriter Taylor Swift. It commenced on March 17, 2023, in Glendale, Arizona, and is set to conclude on December 8, 2024, in Vancouver, British Columbia, comprising 149 shows.",
    location: "National Stadium, Singapore",
    date: "2026-03-01T19:00:00",
    price: 20000,
    totalTickets: 50000,
    availableTickets: 500,
    imageUrl:
      "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&auto=format&fit=crop",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: "Coldplay: Music of the Spheres",
    description:
      "Music of the Spheres World Tour by British rock band Coldplay to promote their ninth studio album Music of the Spheres. The tour kicked off on March 18, 2022, in San José, Costa Rica, and will conclude in September 2024.",
    location: "National Stadium, Singapore",
    date: "2026-04-15T20:00:00",
    price: 18000,
    totalTickets: 40000,
    availableTickets: 1200,
    imageUrl:
      "https://images.unsplash.com/photo-1470229722913-7ea051c24efc?w=800&auto=format&fit=crop",
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    title: "Formula 1 Singapore Grand Prix",
    description:
      "The original night race, featuring high-speed action on the Marina Bay Street Circuit. Experience world-class racing under the lights with stunning views of Singapore's skyline.",
    location: "Marina Bay Street Circuit",
    date: "2026-09-20T20:00:00",
    price: 50000,
    totalTickets: 10000,
    availableTickets: 50,
    imageUrl:
      "https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?w=800&auto=format&fit=crop",
    createdAt: new Date().toISOString(),
  },
];

let mockTickets: Array<{
  id: number;
  userId: string;
  eventId: number;
  event: typeof mockEvents[0];
  nftTokenId: string | null;
  status: "active" | "used" | "burned";
  seat: string | null;
  purchasePrice: number;
  purchaseDate: string;
}> = [];

let ticketIdCounter = 1;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateQRData(ticketId: number) {
  const timestamp = Date.now();
  const signature = crypto.randomBytes(32).toString("hex");
  return {
    signature,
    timestamp,
    walletAddress: mockUser.id,
    ticketId,
  };
}

function findEventById(id: number) {
  return mockEvents.find((event) => event.id === id);
}

function findTicketById(id: number) {
  return mockTickets.find((ticket) => ticket.id === id);
}

// ============================================================================
// AUTH ROUTES
// ============================================================================

app.get("/api/auth/user", (req, res) => {
  // Always return authenticated user for simplicity
  res.json(mockUser);
});

app.get("/api/logout", (req, res) => {
  res.redirect("/");
});

app.get("/api/login", (req, res) => {
  res.redirect("/");
});

// ============================================================================
// EVENT ROUTES
// ============================================================================

app.get("/api/events", (req, res) => {
  res.json(mockEvents);
});

app.get("/api/events/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const event = findEventById(id);

  if (!event) {
    return res.status(404).json({ message: "Event not found" });
  }

  res.json(event);
});

// ============================================================================
// TICKET ROUTES
// ============================================================================

app.get("/api/tickets", (req, res) => {
  // Return all tickets for the mock user
  res.json(mockTickets);
});

app.get("/api/tickets/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const ticket = findTicketById(id);

  if (!ticket) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  res.json(ticket);
});

app.get("/api/tickets/:id/qr", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const ticket = findTicketById(id);

  if (!ticket) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  const qrData = generateQRData(id);
  res.json(qrData);
});

app.post("/api/tickets/purchase", (req, res) => {
  const { eventId } = req.body;

  if (!eventId) {
    return res.status(400).json({ message: "eventId is required" });
  }

  const event = findEventById(eventId);

  if (!event) {
    return res.status(404).json({ message: "Event not found" });
  }

  if (event.availableTickets <= 0) {
    return res.status(400).json({ message: "No tickets available" });
  }

  // Create new ticket
  const newTicket = {
    id: ticketIdCounter++,
    userId: mockUser.id,
    eventId: event.id,
    event: { ...event },
    nftTokenId: `NFT-${crypto.randomBytes(8).toString("hex")}`,
    status: "active" as const,
    seat: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${
      Math.floor(Math.random() * 100) + 1
    }`,
    purchasePrice: event.price,
    purchaseDate: new Date().toISOString(),
  };

  mockTickets.push(newTicket);

  // Decrement available tickets
  event.availableTickets -= 1;

  res.status(201).json(newTicket);
});

app.post("/api/tickets/transfer", (req, res) => {
  const { ticketId, recipientUsername } = req.body;

  if (!ticketId || !recipientUsername) {
    return res.status(400).json({
      message: "ticketId and recipientUsername are required",
    });
  }

  const ticket = findTicketById(ticketId);

  if (!ticket) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  if (ticket.status === "burned") {
    return res.status(400).json({ message: "Ticket already burned" });
  }

  // Mark old ticket as burned
  ticket.status = "burned";

  // Create new ticket for recipient (simulate NFT burn/mint)
  const newTicket = {
    id: ticketIdCounter++,
    userId: recipientUsername, // In real app, look up user by username
    eventId: ticket.eventId,
    event: ticket.event,
    nftTokenId: `NFT-${crypto.randomBytes(8).toString("hex")}`,
    status: "active" as const,
    seat: ticket.seat,
    purchasePrice: ticket.purchasePrice,
    purchaseDate: new Date().toISOString(),
  };

  mockTickets.push(newTicket);

  res.json({
    success: true,
    newTicketId: newTicket.id,
    message: `Ticket transferred to ${recipientUsername}`,
  });
});

// ============================================================================
// VITE INTEGRATION (Development Mode)
// ============================================================================

if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    configFile: resolve(__dirname, "../vite.config.ts"),
    server: { middlewareMode: true },
    appType: "custom",
    root: resolve(__dirname, "../client"),
  });

  app.use(vite.middlewares);

  // SPA fallback - serve index.html for all other routes
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // Read the index.html file
      const template = await readFile(
        resolve(__dirname, "../client/index.html"),
        "utf-8"
      );

      // Apply Vite HTML transforms
      const html = await vite.transformIndexHtml(url, template);

      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      console.error("Error serving HTML:", e);
      next(e);
    }
  });
}

// ============================================================================
// ERROR HANDLER
// ============================================================================

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Error:", err);
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
