import { useEvents } from "@/hooks/use-events";
import { EventCard } from "@/components/event-card";
import { Loader2, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function HomePage() {
  const { data: events, isLoading, error } = useEvents();
  const [search, setSearch] = useState("");

  const filteredEvents = events?.filter(e => 
    e.title.toLowerCase().includes(search.toLowerCase()) || 
    e.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative py-12 md:py-20 text-center space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Live on XRP Ledger
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-white">
            Tickets. <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-300">Verified.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            The anti-scalp ticketing platform powered by blockchain identity. 
            Secure your entry with soulbound NFT tickets.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-md mx-auto relative group"
        >
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search events, artists, or venues..." 
              className="pl-12 h-14 rounded-full bg-card/80 backdrop-blur border-white/10 focus:border-primary/50 text-lg shadow-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </motion.div>
      </section>

      {/* Events Grid */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-display font-bold">Upcoming Events</h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-20 text-destructive">
            Failed to load events. Please try again.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents?.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="h-full"
              >
                <EventCard event={event} />
              </motion.div>
            ))}
            
            {filteredEvents?.length === 0 && (
              <div className="col-span-full text-center py-20 text-muted-foreground">
                No events found matching your search.
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
