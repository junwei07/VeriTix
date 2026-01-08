import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEffect, useState } from "react";
import { MOCK_EVENTS, MOCK_LISTINGS } from "@/lib/mock-data";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export default function PaymentPage() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<string | null>(null);
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
  
  useEffect(() => {
    try {
      const raw = localStorage.getItem("mock_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed.username || null);
      }
    } catch (e) {}
  }, []);

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
              <div className="text-sm text-muted-foreground">Hello {user ?? "guest"}</div>
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm">Total</div>
                  <div className="font-semibold">S$ {(amountCents ? (amountCents/100).toFixed(2) : "100.00")}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              <Button
                onClick={() => {
                  // create a mock order id and open receipt modal
                  const id = `ORD-${Date.now().toString().slice(-6)}`;
                  setOrderId(id);
                  setReceiptOpen(true);

                  // persist mock purchase to localStorage for mock users
                  try {
                    const raw = localStorage.getItem("mock_user");
                    if (raw) {
                      const parsed = JSON.parse(raw);
                      const username = parsed.username;
                      const existing = localStorage.getItem("mock_user_nfts");
                      const arr = existing ? JSON.parse(existing) : [];
                        const newNft: any = {
                          id: `NFT-${Date.now().toString().slice(-6)}`,
                          owner: username,
                          orderId: id,
                          description: description ?? "Order",
                          amountCents: amountCents ?? 10000,
                          itemType: itemType,
                          refId: refId,
                          createdAt: new Date().toISOString(),
                        };

                        // If purchasing a listing, copy the ticket and image data into the owned NFT
                        if (itemType === "listing" && refId !== null) {
                          try {
                            const rawListings = localStorage.getItem("mock_listings");
                            const localListings = rawListings ? JSON.parse(rawListings) : [];
                            // try to find in local listings first, otherwise from MOCK_LISTINGS
                            let listing = localListings.find((l: any) => Number(l.id) === Number(refId));
                            if (!listing) {
                              listing = MOCK_LISTINGS.find((l) => Number(l.id) === Number(refId));
                            }
                            if (listing) {
                              // attach ticket/event snapshot to the purchased NFT
                              newNft.ticket = listing.ticket;
                              if (!newNft.ticket.seat) {
                                newNft.ticket.seat = listing.ticket?.seat || listing.ticket?.seat || undefined;
                              }
                              // also copy common imageUrl paths for compatibility
                              newNft.imageUrl = listing.ticket?.imageUrl || listing.ticket?.event?.imageUrl || "";

                              // remove listing from localStorage (if it was a user-created listing)
                              if (rawListings) {
                                const remaining = localListings.filter((l: any) => Number(l.id) !== Number(refId));
                                localStorage.setItem("mock_listings", JSON.stringify(remaining));
                                window.dispatchEvent(new Event("mock_listings_changed"));
                              } else {
                                // Listing came from built-in MOCK_LISTINGS — mark as removed so it won't show
                                try {
                                  const removedRaw = localStorage.getItem('mock_listings_removed');
                                  const removed = removedRaw ? JSON.parse(removedRaw) : [];
                                  if (!removed.includes(listing.id)) {
                                    removed.push(listing.id);
                                    localStorage.setItem('mock_listings_removed', JSON.stringify(removed));
                                    window.dispatchEvent(new Event('mock_listings_changed'));
                                  }
                                } catch (e) {
                                  // ignore
                                }
                              }
                            }
                          } catch (e) {
                            // ignore listing-read errors
                          }
                        }

                        arr.push(newNft);
                      localStorage.setItem("mock_user_nfts", JSON.stringify(arr));
                      // notify listeners
                      window.dispatchEvent(new Event("mock_user_nfts_changed"));
                    }
                  } catch (e) {
                    // ignore
                  }
                }}
              >
                Pay now
              </Button>
              <Button variant="ghost" onClick={() => setLocation("/")}>Back to home</Button>
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={receiptOpen} onOpenChange={(open) => setReceiptOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment successful</DialogTitle>
            <DialogDescription>Your payment has been processed (mock).</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="text-sm">Order ID: <span className="font-mono">{orderId}</span></div>
            <div className="text-sm">Paid by: <span className="font-medium">{user ?? "guest"}</span></div>
            <div className="text-sm">Item: <span className="font-medium">{description ?? "Order"}</span></div>
            <div className="text-sm">Method: <span className="font-medium">{method === "card" ? "Credit Card" : "PayNow QR"}</span></div>
            <div className="text-sm">Amount: <span className="font-semibold">S$ {(amountCents ? (amountCents/100).toFixed(2) : "100.00")}</span></div>
          </div>

          <DialogFooter>
            <div className="flex gap-2 w-full justify-end">
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
