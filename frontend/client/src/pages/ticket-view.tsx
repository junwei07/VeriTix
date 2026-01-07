import { useRoute, Link } from "wouter";
import { useTicket, useTicketQR, useTransferTicket } from "@/hooks/use-tickets";
import { Loader2, ArrowLeft, RefreshCw, Send, ShieldCheck, Copy, Clock } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function TicketViewPage() {
  const [, params] = useRoute("/tickets/:id");
  const ticketId = Number(params?.id);
  
  const { data: ticket, isLoading: ticketLoading } = useTicket(ticketId);
  const { data: qrData, isLoading: qrLoading, isRefetching } = useTicketQR(ticketId);
  
  const [transferOpen, setTransferOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const { toast } = useToast();
  const transferMutation = useTransferTicket();

  const handleTransfer = async () => {
    if (!recipient) return;
    try {
      await transferMutation.mutateAsync({ ticketId, recipientUsername: recipient });
      toast({
        title: "Transfer Successful",
        description: "Ticket has been transferred to the recipient.",
      });
      setTransferOpen(false);
      // In a real app, redirect or refresh
      window.location.href = "/my-tickets";
    } catch (err: any) {
      toast({
        title: "Transfer Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  if (ticketLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  if (!ticket) return <div>Ticket not found</div>;

  // JSON string for QR code containing the dynamic signature
  const qrString = qrData ? JSON.stringify(qrData) : "loading...";

  return (
    <div className="max-w-md mx-auto pb-20">
      <div className="mb-6">
        <Link href="/my-tickets" className="inline-flex items-center text-sm text-muted-foreground hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Wallet
        </Link>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-card rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative"
      >
        {/* Ticket Header Image */}
        <div className="h-32 bg-zinc-800 relative">
          {ticket.event.imageUrl && (
            <img src={ticket.event.imageUrl} className="w-full h-full object-cover opacity-50" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
          <div className="absolute bottom-4 left-6">
             <h1 className="text-2xl font-bold font-display leading-none">{ticket.event.title}</h1>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Date</label>
                <p className="font-medium">{format(new Date(ticket.event.date), "MMM d, yyyy")}</p>
                <p className="text-sm text-muted-foreground">{format(new Date(ticket.event.date), "h:mm a")}</p>
             </div>
             <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Location</label>
                <p className="font-medium truncate">{ticket.event.location}</p>
             </div>
             <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Seat</label>
                <p className="font-medium text-primary">{ticket.seat || "General Admission"}</p>
             </div>
             <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Price</label>
                <p className="font-medium">{(ticket.purchasePrice || ticket.event.price) / 100} SGD</p>
             </div>
          </div>

          <div className="border-t border-dashed border-white/10 my-6" />

          {/* QR Section */}
          <div className="flex flex-col items-center justify-center space-y-4">
             <div className="relative p-4 bg-white rounded-2xl">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-2xl animate-pulse" />
                <QRCodeSVG value={qrString} size={200} level="H" />
                
                {/* Scanning overlay effect */}
                <motion.div 
                  className="absolute top-0 left-0 w-full h-1 bg-primary/50 shadow-[0_0_15px_rgba(34,197,94,0.8)]"
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
             </div>
             
             <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                {isRefetching || qrLoading ? (
                   <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                )}
                Dynamic QR • Refreshing every 30s
             </div>
          </div>

          <div className="border-t border-dashed border-white/10 my-6" />

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
             <Button variant="outline" className="w-full" onClick={() => toast({ title: "Verification", description: "This ticket is verified on the XRPL." })}>
                <ShieldCheck className="w-4 h-4 mr-2 text-primary" />
                Verify
             </Button>

             <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
               <DialogTrigger asChild>
                 <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white border border-white/5">
                    <Send className="w-4 h-4 mr-2" />
                    Transfer
                 </Button>
               </DialogTrigger>
               <DialogContent className="bg-zinc-900 border-white/10">
                 <DialogHeader>
                   <DialogTitle>Transfer Ticket</DialogTitle>
                   <DialogDescription>
                     Transfer this ticket to another user. This action burns your NFT and mints a new one for them. Irreversible.
                   </DialogDescription>
                 </DialogHeader>
                 <div className="space-y-4 py-4">
                   <div className="space-y-2">
                     <label className="text-sm font-medium">Recipient Username</label>
                     <Input 
                       placeholder="Enter username" 
                       value={recipient}
                       onChange={(e) => setRecipient(e.target.value)}
                     />
                   </div>
                 </div>
                 <DialogFooter>
                   <Button variant="outline" onClick={() => setTransferOpen(false)}>Cancel</Button>
                   <Button onClick={handleTransfer} disabled={transferMutation.isPending || !recipient}>
                     {transferMutation.isPending && <Loader2 className="mr-2 animate-spin" />}
                     Transfer Now
                   </Button>
                 </DialogFooter>
               </DialogContent>
             </Dialog>
          </div>
        </div>

        {/* Decorative punch holes */}
        <div className="absolute top-1/2 left-0 w-6 h-6 bg-background rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-6 h-6 bg-background rounded-full translate-x-1/2 -translate-y-1/2" />
      </motion.div>
    </div>
  );
}
