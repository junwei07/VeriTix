import { useMyTickets } from "@/hooks/use-tickets";
import { TicketCard } from "@/components/ticket-card";
import { Loader2, Ticket as TicketIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function MyTicketsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: tickets, isLoading, error } = useMyTickets();

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
     return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
           <h2 className="text-2xl font-bold">Please login to view your wallet</h2>
           <Link href="/login"><Button>Login</Button></Link>
        </div>
     );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold">My Wallet</h1>
          <p className="text-muted-foreground mt-2">
            Your secure collection of verified event tickets.
          </p>
        </div>
        <div className="hidden md:block">
           <div className="px-4 py-2 bg-primary/10 rounded-full border border-primary/20 text-primary text-sm font-mono">
             {tickets?.length || 0} Assets Owned
           </div>
        </div>
      </div>

      {error ? (
        <div className="text-destructive text-center py-10">Failed to load tickets.</div>
      ) : tickets?.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-3xl border border-white/5 space-y-4">
          <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
             <TicketIcon className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold">No tickets yet</h3>
          <p className="text-muted-foreground">Browse events to purchase your first ticket.</p>
          <Link href="/">
            <Button className="mt-4">Browse Events</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tickets?.map((ticket, i) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
            >
              <TicketCard ticket={ticket} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
