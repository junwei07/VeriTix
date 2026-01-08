import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { MOCK_EVENTS, MOCK_LISTINGS } from "@/lib/mock-data";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { purchaseTicket } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type PaymentStatus = "idle" | "processing-payment" | "minting-ticket" | "success" | "error";

export default function PaymentPage() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [method, setMethod] = useState("card");
  const [cardNumber, setCardNumber] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [country, setCountry] = useState("SG");
  const [postal, setPostal] = useState("");
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [itemType, setItemType] = useState<"event" | "listing" | null>(null);
  const [refId, setRefId] = useState<number | null>(null);
  const [amountCents, setAmountCents] = useState<number | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [nftData, setNftData] = useState<{ tokenId: string; txHash: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Redirect if not logged in
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated && user === null) {
      const currentPath = window.location.pathname + window.location.search;
      setLocation(`/login?next=${encodeURIComponent(currentPath)}`);
    }
  }, [isAuthenticated, isLoading, user, setLocation]);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const eventId = params.get("eventId");
      const listingId = params.get("listingId");

      if (eventId) {
        const id = Number(eventId);
        const ev = MOCK_EVENTS.find((e) => e.id === id);
        if (ev) {
          setAmountCents(ev.price);
          setDescription(ev.title);
          setItemType("event");
          setRefId(id);
        }
      } else if (listingId) {
        const id = Number(listingId);
        const listing = MOCK_LISTINGS.find((l) => l.id === id);
        if (listing) {
          setAmountCents(listing.price);
          setDescription(`${listing.ticket.event.title} — ${listing.ticket.seat}`);
          setItemType("listing");
          setRefId(id);
        }
      }
    } catch (e) {}
  }, []);

  const handlePayment = async () => {
    if (!user || !isAuthenticated) {
      setError("Please login first");
      return;
    }

    if (!refId || !itemType) {
      setError("Invalid purchase item");
      return;
    }

    setError(null);
    setPaymentStatus("processing-payment");

    try {
      // Step 1: Mock Stripe Checkout (simulate payment processing)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Step 2: Mint NFT on XRPL
      setPaymentStatus("minting-ticket");
      
      const ticketType = itemType === "event" 
        ? `event_${refId}` 
        : `listing_${refId}`;

      const result = await purchaseTicket({
        userAddress: user.walletAddress,
        ticketType,
      });

      // Step 3: Store ticket in localStorage
      const ticketRecord = {
        tokenId: result.tokenId,
        txHash: result.txHash,
        ticketType,
        eventId: itemType === "event" ? refId : undefined,
        purchasedAt: new Date().toISOString(),
        walletAddress: user.walletAddress,
        orderId: `ORD-${Date.now().toString().slice(-6)}`,
        description: description ?? "Ticket",
        amountCents: amountCents ?? 0,
      };

      // Store in veritix_tickets
      try {
        const existing = localStorage.getItem("veritix_tickets");
        const tickets = existing ? JSON.parse(existing) : [];
        tickets.push(ticketRecord);
        localStorage.setItem("veritix_tickets", JSON.stringify(tickets));
        window.dispatchEvent(new CustomEvent("veritix_tickets_changed"));
      } catch (e) {
        console.error("Failed to save ticket to localStorage", e);
      }

      // Step 4: Success
      setNftData({
        tokenId: result.tokenId,
        txHash: result.txHash,
      });
      setOrderId(ticketRecord.orderId);
      setPaymentStatus("success");
      setReceiptOpen(true);

      toast({
        title: "Ticket Purchased & Minted!",
        description: `Your ticket has been secured on the XRP Ledger.`,
      });

    } catch (err: any) {
      setPaymentStatus("error");
      const errorMessage = err.message || "Failed to complete purchase. Please try again.";
      setError(errorMessage);
      toast({
        title: "Purchase Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen flex items-start justify-center py-12 px-4">
      <Card className="w-full max-w-3xl p-6">
        <h2 className="text-2xl font-semibold mb-4">Pay by</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: payment options */}
          <div className="space-y-4">
            <RadioGroup value={method} onValueChange={(v) => setMethod(v)} className="grid gap-4">
              <label className={`border rounded-lg p-4 flex items-start gap-3 cursor-pointer ${method === "paynow" ? "ring-2 ring-primary" : ""}`}>
                <div className="pt-1">
                  <RadioGroupItem value="paynow" />
                </div>
                <div>
                  <div className="font-medium">PayNow QR</div>
                </div>
              </label>

              <label className={`border rounded-lg p-4 flex items-start gap-3 cursor-pointer ${method === "card" ? "ring-2 ring-primary" : ""}`}>
                <div className="pt-1">
                  <RadioGroupItem value="card" />
                </div>
                <div className="w-full">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">Credit Card</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <img src="/visa.svg" alt="visa" className="h-4" />
                      <img src="/mastercard.svg" alt="mc" className="h-4" />
                      <img src="/amex.svg" alt="amex" className="h-4" />
                    </div>
                  </div>

                  {method === "card" && (
                    <div className="mt-4 border rounded-md p-4 bg-muted/5">
                      <div className="text-sm font-medium mb-2">Card Details</div>
                      <div className="grid grid-cols-1 gap-3">
                        <Input placeholder="Card number" value={cardNumber} onChange={(e) => setCardNumber((e.target as HTMLInputElement).value)} />
                        <div className="grid grid-cols-3 gap-3">
                          <Input placeholder="MM / YY" value={exp} onChange={(e) => setExp((e.target as HTMLInputElement).value)} />
                          <Input placeholder="CVC" value={cvc} onChange={(e) => setCvc((e.target as HTMLInputElement).value)} />
                          <div />
                        </div>

                        <div className="text-xs text-muted-foreground p-3 bg-blue-50 rounded">Please note that American Express corporate cards cannot be used.</div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-sm mb-1">Country of Billing Address</div>
                            <Select defaultValue={country} onValueChange={(v) => setCountry(v)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="SG">Singapore</SelectItem>
                                <SelectItem value="MY">Malaysia</SelectItem>
                                <SelectItem value="US">United States</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <div className="text-sm mb-1">Postal Code</div>
                            <Input placeholder="Example 123456" value={postal} onChange={(e) => setPostal((e.target as HTMLInputElement).value)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </label>
            </RadioGroup>
          </div>

          {/* Right: summary and actions */}
          <div>
            <div className="border rounded-lg p-4 mb-4">
              <div className="text-sm text-muted-foreground">Hello {user?.nric ?? "guest"}</div>
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm">Total</div>
                  <div className="font-semibold">S$ {(amountCents ? (amountCents/100).toFixed(2) : "100.00")}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              {/* Status Messages */}
              {paymentStatus === "processing-payment" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-sm text-primary bg-primary/10 p-3 rounded-lg border border-primary/20"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Payment...</span>
                </motion.div>
              )}

              {paymentStatus === "minting-ticket" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-sm text-primary bg-primary/10 p-3 rounded-lg border border-primary/20"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Minting Secure Ticket on XRPL...</span>
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </motion.div>
              )}

              <Button
                onClick={handlePayment}
                disabled={paymentStatus !== "idle" || !isAuthenticated}
                className="w-full"
              >
                {paymentStatus === "processing-payment" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing Payment...
                  </>
                ) : paymentStatus === "minting-ticket" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Minting Ticket...
                  </>
                ) : (
                  "Pay now"
                )}
              </Button>
              <Button variant="ghost" onClick={() => setLocation("/")} disabled={paymentStatus !== "idle"}>
                Back to home
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={receiptOpen} onOpenChange={(open) => setReceiptOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Payment Successful
            </DialogTitle>
            <DialogDescription>
              Your ticket has been minted as a Soulbound NFT on the XRP Ledger.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Order ID</div>
              <div className="font-mono text-sm">{orderId}</div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Item</div>
              <div className="font-medium">{description ?? "Order"}</div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Amount</div>
              <div className="font-semibold text-lg">S$ {(amountCents ? (amountCents/100).toFixed(2) : "100.00")}</div>
            </div>

            {nftData && (
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-medium">Ticket Secured on XRPL</span>
                </div>
                <div className="space-y-2 bg-zinc-900/50 p-3 rounded-lg">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Token ID</div>
                    <div className="font-mono text-xs break-all">{nftData.tokenId}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Transaction Hash</div>
                    <div className="font-mono text-xs break-all">{nftData.txHash}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => {
                  setReceiptOpen(false);
                  setLocation("/my-tickets");
                }}
              >
                View Tickets
              </Button>
              <Button
                onClick={() => {
                  setReceiptOpen(false);
                  setLocation("/");
                }}
              >
                Done
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
