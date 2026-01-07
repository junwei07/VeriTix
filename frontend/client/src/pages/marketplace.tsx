import { useEvents } from "@/hooks/use-events";
import { EventCard } from "@/components/event-card";
import { Loader2, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function MarketplacePage() {
  const { data: events, isLoading, error } = useEvents();
  const [search, setSearch] = useState("");

  const filteredEvents = events?.filter(e => 
    e.title.toLowerCase().includes(search.toLowerCase()) || 
    e.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <section className="space-y-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-2"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-white">
            Marketplace
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Discover upcoming concerts, events, and experiences. Secure your tickets with blockchain-verified NFTs.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-md relative group"
        >
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search events, artists, or venues..." 
              className="pl-12 h-12 rounded-full bg-card/80 backdrop-blur border-white/10 focus:border-primary/50 text-base shadow-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </motion.div>
      </section>

      {/* Events Grid */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold">Upcoming Events</h2>
          {filteredEvents && (
            <span className="text-sm text-muted-foreground">
              {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
            </span>
          )}
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
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="h-full"
              >
                <EventCard event={event} />
              </motion.div>
            ))}
            
            {filteredEvents?.length === 0 && (
              <div className="col-span-full text-center py-20 text-muted-foreground">
                {search ? 'No events found matching your search.' : 'No upcoming events at this time.'}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

