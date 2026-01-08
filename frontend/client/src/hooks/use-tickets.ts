import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import { MOCK_TICKETS } from "@/lib/mock-data";

// GET /api/tickets (List my tickets)
export function useMyTickets() {
  return useQuery({
    queryKey: [api.tickets.list.path],
    queryFn: async () => {
      // Return mock tickets for display
      return MOCK_TICKETS;

      /*
      const res = await fetch(api.tickets.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tickets");
      return api.tickets.list.responses[200].parse(await res.json());
      */
    },
  });
}

// GET /api/tickets/:id (Get single ticket details)
export function useTicket(id: number) {
  return useQuery({
    queryKey: [api.tickets.get.path, id],
    queryFn: async () => {
      // Find in mock tickets
      const ticket = MOCK_TICKETS.find(t => t.id === id);
      if (ticket) return ticket;

      const url = buildUrl(api.tickets.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok) {
        const msg = data && (data.message || data.error) ? (data.message || data.error) : res.statusText;
        throw new Error(msg || "Failed to fetch ticket");
      }
      if (!data) throw new Error("Empty response from server");
      return api.tickets.get.responses[200].parse(data);
    },
    enabled: !!id,
  });
}

// GET /api/tickets/:id/qr (Dynamic QR Code Data - Polling)
export function useTicketQR(id: number) {
  return useQuery({
    queryKey: [api.tickets.generateQR.path, id],
    queryFn: async () => {
      const url = buildUrl(api.tickets.generateQR.path, { id });
      const res = await fetch(url, { credentials: "include" });
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok) {
        const msg = data && (data.message || data.error) ? (data.message || data.error) : res.statusText;
        throw new Error(msg || "Failed to generate QR");
      }
      if (!data) throw new Error("Empty response from server");
      return api.tickets.generateQR.responses[200].parse(data);
    },
    enabled: !!id,
    refetchInterval: 30000, // Poll every 30 seconds for dynamic QR
  });
}

// POST /api/tickets/purchase
export function usePurchaseTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId }: { eventId: number }) => {
      const res = await fetch(api.tickets.purchase.path, {
        method: api.tickets.purchase.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
        credentials: "include",
      });
      
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok) {
        const msg = data && (data.message || data.error) ? (data.message || data.error) : res.statusText;
        throw new Error(msg || "Failed to purchase ticket");
      }
      if (!data) throw new Error("Empty response from server");
      return api.tickets.purchase.responses[201].parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tickets.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.events.list.path] });
    },
  });
}

// POST /api/tickets/transfer
export function useTransferTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, recipientUsername }: { ticketId: number, recipientUsername: string }) => {
      const res = await fetch(api.tickets.transfer.path, {
        method: api.tickets.transfer.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, recipientUsername }),
        credentials: "include",
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok) {
        const msg = data && (data.message || data.error) ? (data.message || data.error) : res.statusText;
        throw new Error(msg || "Failed to transfer ticket");
      }
      if (!data) throw new Error("Empty response from server");
      return api.tickets.transfer.responses[200].parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tickets.list.path] });
    },
  });
}
