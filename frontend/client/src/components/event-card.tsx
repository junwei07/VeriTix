import { Event } from "@shared/schema";
import { Link } from "wouter";
import { Calendar, MapPin, Tag } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export function EventCard({ event }: { event: Event }) {
  // Safe format date
  const eventDate = new Date(event.date);

  return (
    <Link href={`/events/${event.id}`}>
      <motion.div 
        whileHover={{ y: -5 }}
        className="group relative overflow-hidden rounded-2xl bg-card border border-white/5 shadow-lg hover:shadow-[0_0_30px_rgba(34,197,94,0.1)] hover:border-primary/30 transition-all duration-300 cursor-pointer h-full flex flex-col"
      >
        {/* Image / Placeholder */}
        <div className="h-48 w-full bg-zinc-900 relative overflow-hidden">
          {event.imageUrl ? (
            <img 
              src={event.imageUrl} 
              alt={event.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
              <span className="text-zinc-700 font-display font-bold text-4xl select-none group-hover:text-primary/20 transition-colors">
                VERITIX
              </span>
            </div>
          )}
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-mono text-white">
            {event.availableTickets} left
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-bold font-display text-white group-hover:text-primary transition-colors line-clamp-1">
              {event.title}
            </h3>
          </div>

          <div className="space-y-2 mt-auto">
            <div className="flex items-center text-sm text-muted-foreground gap-2">
              <Calendar className="w-4 h-4 text-primary/70" />
              <span>{format(eventDate, "PPP p")}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground gap-2">
              <MapPin className="w-4 h-4 text-primary/70" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-primary">
              <Tag className="w-4 h-4" />
              <span className="font-bold font-mono text-lg">
                {(event.price / 100).toFixed(2)} SGD
              </span>
            </div>
            <span className="text-xs text-muted-foreground font-mono bg-zinc-900 px-2 py-1 rounded">
              XRPL Verified
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
