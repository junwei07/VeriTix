import { Listing } from "@/lib/mock-data";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { ShoppingCart, User, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function MarketplaceCard({ listing, index }: { listing: Listing; index: number }) {
  const { ticket, price, sellerName } = listing;
  const { event } = ticket;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative flex flex-col bg-card/50 hover:bg-card/80 backdrop-blur-sm border border-white/10 rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1"
    >
      {/* Event Image Section */}
      <div className="relative h-40 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
        <img
          src={event.imageUrl || ""}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80"
        />
        <div className="absolute top-4 left-4 z-20">
          <Badge variant="secondary" className="backdrop-blur-md bg-black/40 border-white/10 text-white">
            <Ticket className="w-3 h-3 mr-1 text-emerald-400" />
            Resale
          </Badge>
        </div>
      </div>

      {/* Ticket Details (The "Stub") */}
      <div className="relative p-5 pt-2 flex flex-col gap-4 flex-1">
        {/* Decorative Notches (Visual only using CSS radial gradients usually, but simple dots here) */}
        <div className="absolute -top-3 -left-3 w-6 h-6 bg-background rounded-full z-20" />
        <div className="absolute -top-3 -right-3 w-6 h-6 bg-background rounded-full z-20" />
        <div className="absolute top-0 left-3 right-3 border-t-2 border-dashed border-white/10" />

        <div className="space-y-1">
          <h3 className="font-display font-bold text-xl text-white leading-tight group-hover:text-primary transition-colors">
            {event.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {format(new Date(event.date), "PPP • p")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="bg-white/5 rounded-lg p-2 border border-white/5">
            <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Seat</p>
            <p className="font-mono font-medium text-white">{ticket.seat}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-2 border border-white/5">
             <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Seller</p>
             <div className="flex items-center gap-1.5 overflow-hidden">
                <User className="w-3 h-3 text-primary/70 shrink-0" />
                <p className="font-medium text-white truncate text-xs">{sellerName}</p>
             </div>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between pt-2">
           <div>
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="text-2xl font-display font-bold text-emerald-400">
                ${(price / 100).toFixed(2)}
              </p>
           </div>
           <Button size="sm" className="rounded-full px-5 font-semibold bg-white text-black hover:bg-white/90">
              Buy
           </Button>
        </div>
      </div>
    </motion.div>
  );
}
