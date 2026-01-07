import { useEvents } from "@/hooks/use-events";
import { EventCard } from "@/components/event-card";
import { Loader2, Search, Calendar, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function EventsPage() {
  const { data: events, isLoading, error } = useEvents();
  const [search, setSearch] = useState("");

  const filteredEvents = events?.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative min-h-screen pb-20 overflow-hidden">
      {/* Fixed Background Gradients */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 md:px-6 space-y-12 pt-10">
        {/* Page Header */}
        <section className="flex flex-col md:flex-row gap-8 justify-between items-end">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4 max-w-2xl"
          >
            <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-white">
              Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Events</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Discover upcoming concerts, workshops, and experiences. Secure your spot on the blockchain.
            </p>
          </motion.div>

          {/* Search & Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full md:w-auto flex flex-col sm:flex-row gap-4"
          >
            <div className="relative group w-full md:w-80">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-20 group-hover:opacity-30 blur transition duration-500" />
              <div className="relative flex items-center bg-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-2 shadow-2xl">
                <Search className="ml-3 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base h-10 placeholder:text-muted-foreground/50"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <Button variant="outline" className="h-14 rounded-xl border-white/10 bg-card/50 backdrop-blur-xl hover:bg-white/10 gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </motion.div>
        </section>

        {/* Events Grid */}
        <section>
          {isLoading ? (
            <div className="flex justify-center py-40">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-40 text-destructive bg-destructive/10 rounded-3xl border border-destructive/20">
              Failed to load events. Please try again.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents?.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="h-full"
                >
                  <EventCard event={event} className="h-full" />
                </motion.div>
              ))}

              {filteredEvents?.length === 0 && (
                <div className="col-span-full text-center py-32 text-muted-foreground border border-dashed border-white/10 rounded-3xl bg-white/5">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No events found</p>
                  <p className="text-sm">Try adjusting your search terms</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}