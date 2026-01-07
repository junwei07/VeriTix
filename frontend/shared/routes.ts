import { z } from 'zod';
import { insertUserSchema, insertEventSchema, insertTicketSchema, events, tickets, users } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  // Auth is handled by Replit Auth blueprint, but we might need a profile endpoint
  auth: {
    me: {
      method: 'GET' as const,
      path: '/api/me',
      responses: {
        200: z.custom<typeof users.$inferSelect>(), // Returns the DB user with wallet info
        401: errorSchemas.unauthorized,
      },
    }
  },
  events: {
    list: {
      method: 'GET' as const,
      path: '/api/events',
      responses: {
        200: z.array(z.custom<typeof events.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/events/:id',
      responses: {
        200: z.custom<typeof events.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  tickets: {
    list: {
      method: 'GET' as const,
      path: '/api/tickets', // My tickets
      responses: {
        200: z.array(z.custom<typeof tickets.$inferSelect & { event: typeof events.$inferSelect }>()), // Include event details
      },
    },
    purchase: {
      method: 'POST' as const,
      path: '/api/tickets/purchase',
      input: z.object({
        eventId: z.number(),
      }),
      responses: {
        201: z.custom<typeof tickets.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound, // Event not found or sold out
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/tickets/:id',
      responses: {
        200: z.custom<typeof tickets.$inferSelect & { event: typeof events.$inferSelect, qrData?: string }>(), 
        404: errorSchemas.notFound,
      },
    },
    transfer: {
      method: 'POST' as const,
      path: '/api/tickets/transfer',
      input: z.object({
        ticketId: z.number(),
        recipientUsername: z.string(), // Simple transfer by username for now
      }),
      responses: {
        200: z.object({ success: z.boolean(), newTicketId: z.number() }),
        400: errorSchemas.validation,
        403: z.object({ message: z.string() }), // Not owner
      },
    },
    generateQR: {
      method: 'GET' as const,
      path: '/api/tickets/:id/qr', // Get dynamic QR data
      responses: {
        200: z.object({
          signature: z.string(),
          timestamp: z.number(),
          walletAddress: z.string(),
          ticketId: z.number()
        }),
        403: errorSchemas.unauthorized,
      },
    }
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
