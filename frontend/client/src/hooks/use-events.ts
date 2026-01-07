import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type Event } from "@shared/schema";
import { MOCK_EVENTS } from "@/lib/mock-data";

// GET /api/events
export function useEvents() {
  return useQuery({
    queryKey: [api.events.list.path],
    queryFn: async () => {
      // For demonstration, we return mock data directly
      // In a real app, you might want to try fetching from API first
      return MOCK_EVENTS;
      
      /* 
      const res = await fetch(api.events.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch events");
      return api.events.list.responses[200].parse(await res.json());
      */
    },
  });
}

// GET /api/events/:id
export function useEvent(id: number) {
  return useQuery({
    queryKey: [api.events.get.path, id],
    queryFn: async () => {
      // Return from mock data
      const event = MOCK_EVENTS.find(e => e.id === id);
      if (event) return event;

      const url = buildUrl(api.events.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch event");
      return api.events.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}
