import { z } from "zod";

// Event schema
export const eventSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  location: z.string(),
  date: z.string(),
  price: z.number(),
  imageUrl: z.string().nullable().optional(),
  availableTickets: z.number(),
  totalTickets: z.number(),
  createdAt: z.string().optional(),
});

export type Event = z.infer<typeof eventSchema>;

// Ticket schema
export const ticketSchema = z.object({
  id: z.number(),
  userId: z.string(),
  eventId: z.number(),
  event: eventSchema,
  nftTokenId: z.string().nullable().optional(),
  status: z.enum(["active", "used", "burned"]),
  seat: z.string().nullable().optional(),
  purchasePrice: z.number().optional(),
  purchaseDate: z.string(),
});

export type Ticket = z.infer<typeof ticketSchema>;

// QR Code response schema
export const qrCodeSchema = z.object({
  signature: z.string(),
  timestamp: z.number(),
  walletAddress: z.string(),
  ticketId: z.number(),
});

export type QRCode = z.infer<typeof qrCodeSchema>;
