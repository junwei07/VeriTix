import { z } from "zod";
import { eventSchema, ticketSchema, qrCodeSchema, userSchema } from "./schema";

// Helper function to build URLs with parameters
export function buildUrl(path: string, params: Record<string, any>): string {
  return path.replace(/:(\w+)/g, (_, key) => params[key]);
}

// API contract with Zod schemas for request/response validation
export const api = {
  auth: {
    user: {
      path: "/api/auth/user",
      responses: {
        200: userSchema,
      },
    },
    logout: {
      path: "/api/auth/logout",
    },
    login: {
      path: "/api/auth/login",
    },
  },
  events: {
    list: {
      path: "/api/events",
      responses: {
        200: z.array(eventSchema),
      },
    },
    get: {
      path: "/api/events/:id",
      responses: {
        200: eventSchema,
      },
    },
  },
  tickets: {
    list: {
      path: "/api/tickets",
      responses: {
        200: z.array(ticketSchema),
      },
    },
    get: {
      path: "/api/tickets/:id",
      responses: {
        200: ticketSchema,
      },
    },
    generateQR: {
      path: "/api/tickets/:id/qr",
      responses: {
        200: qrCodeSchema,
      },
    },
    purchase: {
      path: "/api/tickets/purchase",
      method: "POST",
      body: z.object({
        userAddress: z.string(),
        ticketType: z.string(),
      }),
      responses: {
        200: z.object({
          message: z.string(),
          tokenId: z.string(),
          txHash: z.string(),
        }),
      },
    },
    transfer: {
      path: "/api/tickets/transfer",
      method: "POST",
      body: z.object({
        ticketId: z.number(),
        recipientUsername: z.string(),
      }),
      responses: {
        200: z.object({
          success: z.boolean(),
          newTicketId: z.number(),
          message: z.string().optional(),
        }),
      },
    },
  },
};
