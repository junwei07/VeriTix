import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import { MOCK_EVENTS } from "@/lib/mock-data";
import type { Ticket, Event } from "@shared/schema";

interface StoredTicket {
  tokenId: string;
  txHash: string;
  ticketType: string;
  eventId?: number;
  purchasedAt: string;
  walletAddress: string;
  orderId: string;
  description: string;
  amountCents: number;
}

// GET /api/tickets (List my tickets) - reads from localStorage
export function useMyTickets() {
  const [tickets, setTickets] = useState<(Ticket & { event: Event })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTickets = () => {
      try {
        const stored = localStorage.getItem("veritix_tickets");
        if (!stored) {
          setTickets([]);
          setIsLoading(false);
          return;
        }

        const storedTickets: StoredTicket[] = JSON.parse(stored);
        
        // Transform stored tickets to match Ticket schema
        const transformedTickets = storedTickets.map((stored, index) => {
          // Find event from MOCK_EVENTS if eventId exists
          const event = stored.eventId 
            ? MOCK_EVENTS.find(e => e.id === stored.eventId)
            : null;

          // If no event found, create a placeholder
          const eventData: Event = event || {
            id: stored.eventId || 0,
            title: stored.description || "Unknown Event",
            description: "Ticket purchased on VeriTix",
            location: "TBA",
            date: stored.purchasedAt,
            price: stored.amountCents,
            availableTickets: 0,
            totalTickets: 0,
          };

          const ticket: Ticket & { event: Event } = {
            id: index + 1, // Generate ID from index
            userId: stored.walletAddress,
            eventId: stored.eventId || 0,
            event: eventData,
            nftTokenId: stored.tokenId,
            status: "active" as const,
            seat: null,
            purchasePrice: stored.amountCents,
            purchaseDate: stored.purchasedAt,
          };

          return ticket;
        });

        setTickets(transformedTickets);
      } catch (e) {
        console.error("Failed to load tickets from localStorage", e);
        setTickets([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTickets();

    // Listen for ticket changes
    const handleChange = () => loadTickets();
    window.addEventListener("veritix_tickets_changed", handleChange);
    window.addEventListener("storage", handleChange);

    return () => {
      window.removeEventListener("veritix_tickets_changed", handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  return {
    data: tickets,
    isLoading,
    error: null,
  };
}

// GET /api/tickets/:id (Get single ticket details) - reads from localStorage
export function useTicket(id: number) {
  const [ticket, setTicket] = useState<(Ticket & { event: Event }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem("veritix_tickets");
      if (!stored) {
        setTicket(null);
        setIsLoading(false);
        return;
      }

      const storedTickets: StoredTicket[] = JSON.parse(stored);
      const storedTicket = storedTickets[id - 1]; // ID is 1-based index

      if (!storedTicket) {
        setTicket(null);
        setIsLoading(false);
        return;
      }

      // Find event from MOCK_EVENTS
      const event = storedTicket.eventId 
        ? MOCK_EVENTS.find(e => e.id === storedTicket.eventId)
        : null;

      const eventData: Event = event || {
        id: storedTicket.eventId || 0,
        title: storedTicket.description || "Unknown Event",
        description: "Ticket purchased on VeriTix",
        location: "TBA",
        date: storedTicket.purchasedAt,
        price: storedTicket.amountCents,
        availableTickets: 0,
        totalTickets: 0,
      };

      const transformedTicket: Ticket & { event: Event } = {
        id,
        userId: storedTicket.walletAddress,
        eventId: storedTicket.eventId || 0,
        event: eventData,
        nftTokenId: storedTicket.tokenId,
        status: "active" as const,
        seat: null,
        purchasePrice: storedTicket.amountCents,
        purchaseDate: storedTicket.purchasedAt,
      };

      setTicket(transformedTicket);
    } catch (e) {
      console.error("Failed to load ticket from localStorage", e);
      setTicket(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  return {
    data: ticket,
    isLoading,
    error: null,
  };
}

// GET /api/tickets/:id/qr (Dynamic QR Code Data - Mock for now)
export function useTicketQR(id: number) {
  const [qrData, setQrData] = useState<{
    signature: string;
    timestamp: number;
    walletAddress: string;
    ticketId: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem("veritix_tickets");
      if (!stored) {
        setIsLoading(false);
        return;
      }

      const storedTickets: StoredTicket[] = JSON.parse(stored);
      const storedTicket = storedTickets[id - 1];

      if (storedTicket) {
        // Generate mock QR data (in production, this would come from backend)
        const qr = {
          signature: `veritix_${storedTicket.tokenId.slice(0, 16)}_${Date.now()}`,
          timestamp: Date.now(),
          walletAddress: storedTicket.walletAddress,
          ticketId: id,
        };
        setQrData(qr);
      }
    } catch (e) {
      console.error("Failed to generate QR data", e);
    } finally {
      setIsLoading(false);
    }

    // Refresh QR every 30 seconds (mock dynamic QR)
    const interval = setInterval(() => {
      if (id) {
        try {
          const stored = localStorage.getItem("veritix_tickets");
          if (stored) {
            const storedTickets: StoredTicket[] = JSON.parse(stored);
            const storedTicket = storedTickets[id - 1];
            if (storedTicket) {
              const qr = {
                signature: `veritix_${storedTicket.tokenId.slice(0, 16)}_${Date.now()}`,
                timestamp: Date.now(),
                walletAddress: storedTicket.walletAddress,
                ticketId: id,
              };
              setQrData(qr);
            }
          }
        } catch (e) {
          // Ignore
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [id]);

  return {
    data: qrData,
    isLoading,
    isRefetching: false,
  };
}

// POST /api/tickets/purchase
export function usePurchaseTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userAddress, ticketType }: { userAddress: string; ticketType: string }) => {
      const res = await fetch(api.tickets.purchase.path, {
        method: api.tickets.purchase.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAddress, ticketType }),
        credentials: "include",
      });
      
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok) {
        const msg = data && (data.message || data.error) ? (data.message || data.error) : res.statusText;
        throw new Error(msg || "Failed to purchase ticket");
      }
      if (!data) throw new Error("Empty response from server");
      return api.tickets.purchase.responses[200].parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tickets.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.events.list.path] });
    },
  });
}

// Demo transfer (localStorage only)
export function useTransferTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId }: { ticketId: number, recipientUsername: string }) => {
      try {
        const stored = localStorage.getItem("veritix_tickets");
        const tickets: StoredTicket[] = stored ? JSON.parse(stored) : [];

        if (ticketId < 1 || ticketId > tickets.length) {
          throw new Error("Ticket not found");
        }

        const updated = tickets.filter((_ticket, index) => index !== ticketId - 1);
        localStorage.setItem("veritix_tickets", JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("veritix_tickets_changed"));

        return { success: true, newTicketId: ticketId };
      } catch (error: any) {
        throw new Error(error?.message || "Failed to transfer ticket");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tickets.list.path] });
    },
  });
}
