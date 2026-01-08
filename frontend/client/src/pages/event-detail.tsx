import { useRoute } from "wouter";
import { useEvent } from "@/hooks/use-events";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, MapPin, Shield, Ticket, ArrowLeft, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Link } from "wouter";
import { purchaseTicket } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";

export default function EventDetailPage() {
  const [, params] = useRoute("/events/:id");
  const eventId = Number(params?.id);

  const { data: event, isLoading: eventLoading } = useEvent(eventId);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async () => {
    try {
      if (!user?.walletAddress) {
        throw new Error("Missing wallet address");
      }

      setIsPurchasing(true);
      const ticketType = `event_${eventId}`;
      const result = await purchaseTicket({
        userAddress: user.walletAddress,
        ticketType,
      });

      const ticketRecord = {
        tokenId: result.tokenId,
        txHash: result.txHash,
        ticketType,
        eventId,
        purchasedAt: new Date().toISOString(),
        walletAddress: user.walletAddress,
        orderId: `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        description: event?.title || "Ticket",
        amountCents: event?.price || 0,
      };

      try {
        const existing = localStorage.getItem("veritix_tickets");
        const tickets = existing ? JSON.parse(existing) : [];
        tickets.push(ticketRecord);
        localStorage.setItem("veritix_tickets", JSON.stringify(tickets));
        window.dispatchEvent(new CustomEvent("veritix_tickets_changed"));
      } catch (storageError) {
        console.error("Failed to save ticket to localStorage", storageError);
      }

      toast({
        title: "Success! Ticket Minted.",
        description: "Your ticket has been minted on the XRPL. Check your wallet.",
        variant: "default",
      });
      setPurchaseOpen(false);
    } catch (err: any) {
      toast({
        title: "Purchase Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  if (eventLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold">Event not found</h2>
        <Link href="/">
          <Button variant="outline">Back to Events</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-20 max-w-5xl mx-auto">
      {/* Fixed Background Gradients */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[100px]" />
      </div>
      <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Events
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Image */}
          <div className="rounded-3xl overflow-hidden aspect-video bg-zinc-900 border border-white/10 shadow-2xl relative">
            {event.imageUrl ? (
              <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                <span className="text-zinc-600 font-display font-bold text-5xl">VERITIX</span>
              </div>
            )}
            <div className="absolute top-4 right-4 bg-black/80 backdrop-blur border border-primary/20 px-4 py-2 rounded-full text-primary font-bold shadow-lg shadow-primary/10">
              {(event.price / 100).toFixed(2)} SGD
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white leading-tight">
              {event.title}
            </h1>

            <div className="flex flex-wrap gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span>{format(new Date(event.date), "PPP p")}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <span>{event.location}</span>
              </div>
            </div>
          </div>

          <div className="prose prose-invert prose-lg max-w-none">
            <h3 className="font-display">About this event</h3>
            <p>{event.description}</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl sticky top-24 space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-bold font-display">Tickets</h3>
              <p className="text-sm text-muted-foreground">
                {event.availableTickets} remaining of {event.totalTickets}
              </p>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-1000"
                  style={{ width: `${(event.availableTickets / event.totalTickets) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Price</span>
                <span className="font-bold text-lg">{(event.price / 100).toFixed(2)} SGD</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Platform Fee</span>
                <span className="text-primary font-medium">0.00 SGD</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Format</span>
                <span className="font-mono text-xs bg-zinc-800 px-2 py-1 rounded border border-white/10">NFT (XRPL)</span>
              </div>
            </div>

            {isAuthenticated ? (
              <Dialog open={purchaseOpen} onOpenChange={setPurchaseOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full text-lg h-14 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all">
                    Get Tickets
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-zinc-900 border-white/10">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-display">Confirm Purchase</DialogTitle>
                    <DialogDescription>
                      You are about to mint a ticket on the XRP Ledger.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="py-6 space-y-4">
                    <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5">
                      <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                        <Ticket />
                      </div>
                      <div>
                        <h4 className="font-bold">{event.title}</h4>
                        <p className="text-sm text-muted-foreground">{format(new Date(event.date), "PPP")}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-emerald-400 bg-emerald-400/10 p-3 rounded-lg">
                      <Shield className="w-4 h-4" />
                      <span>Verified by Singpass Identity</span>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setPurchaseOpen(false)}>Cancel</Button>
                    <Button
                      onClick={handlePurchase}
                      disabled={isPurchasing}
                      className="min-w-[120px]"
                    >
                      {isPurchasing ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                      )}
                      {isPurchasing ? "Minting..." : "Confirm & Mint"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : (
              <Link href={`/login?next=${encodeURIComponent(`/payment?eventId=${eventId}`)}`}>
                <Button variant="secondary" className="w-full h-12">
                  Login to Buy
                </Button>
              </Link>
            )}

            <p className="text-xs text-center text-muted-foreground pt-2">
              Secure transaction powered by VeriTix Anti-Scalp Protocol
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
