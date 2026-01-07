import { Ticket, Event } from "@shared/schema";
import { Link } from "wouter";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { QrCode } from "lucide-react";

type TicketWithEvent = Ticket & { event: Event };

export function TicketCard({ ticket }: { ticket: TicketWithEvent }) {
  return (
    <Link href={`/tickets/${ticket.id}`}>
      <motion.div 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 to-black border border-white/10 cursor-pointer group"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-primary/50 group-hover:bg-primary transition-colors" />
        
        <div className="p-5 pl-7 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono text-primary mb-1 uppercase tracking-wider">
              {ticket.status === 'active' ? 'Valid Entry' : 'Used/Burned'}
            </p>
            <h3 className="text-lg font-bold text-white truncate font-display">
              {ticket.event.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {format(new Date(ticket.event.date), "PPP")} • {ticket.event.location}
            </p>
          </div>
          
          <div className="flex flex-col items-center justify-center gap-1 bg-white/5 p-3 rounded-lg border border-white/5 group-hover:border-primary/30 transition-colors">
            <QrCode className="w-6 h-6 text-white group-hover:text-primary transition-colors" />
            <span className="text-[10px] font-mono text-muted-foreground">View</span>
          </div>
        </div>

        {/* Decorative Circles */}
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors pointer-events-none" />
      </motion.div>
    </Link>
  );
}
