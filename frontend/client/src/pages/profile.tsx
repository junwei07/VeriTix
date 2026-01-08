import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  LogOut, 
  Ticket, 
  Calendar, 
  MapPin, 
  Hash, 
  CreditCard, 
  ShieldCheck, 
  Clock,
  LayoutGrid,
  ListOrdered,
  Wallet,
  ArrowRight
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ProfilePage() {
  const { user, isLoading, logout } = useAuth();
  const { toast } = useToast();
  const [mockUser, setMockUser] = useState<any | null>(null);
  const [nfts, setNfts] = useState<any[]>([]);
  const [pendingNfts, setPendingNfts] = useState<any[]>([]);
  const [listingInProgress, setListingInProgress] = useState(false);
  const [tab, setTab] = useState<"owned" | "pending">("owned");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [ticketToList, setTicketToList] = useState<any | null>(null);
  const [ticketPriceCents, setTicketPriceCents] = useState<number>(0);

  // =================================================================
  // LOGIC SECTION (UNTOUCHED)
  // =================================================================
  useEffect(() => {
    try {
      const raw = localStorage.getItem("mock_user");
      if (raw) setMockUser(JSON.parse(raw));
      else setMockUser(null);
    } catch (e) {
      setMockUser(null);
    }

    const loadNfts = () => {
      try {
        const legacyRaw = localStorage.getItem("mock_user_nfts");
        const legacy = legacyRaw ? JSON.parse(legacyRaw) : [];
        const ticketRaw = localStorage.getItem("veritix_tickets");
        const tickets = ticketRaw ? JSON.parse(ticketRaw) : [];
        const pendingRaw = localStorage.getItem("veritix_tickets_pending");
        const pendingTickets = pendingRaw ? JSON.parse(pendingRaw) : [];
        const pendingLegacyRaw = localStorage.getItem("mock_user_nfts_pending");
        const pendingLegacy = pendingLegacyRaw ? JSON.parse(pendingLegacyRaw) : [];

        const owner =
          (user && user.walletAddress) ||
          (mockUser && (mockUser.username || mockUser.email));

        const ownedTickets = owner
          ? tickets.filter((x: any) => x.walletAddress === owner)
          : [];

        const legacyOwned = owner
          ? legacy.filter((x: any) => x.owner === owner)
          : [];

        const ownedPending = owner
          ? pendingTickets.filter((x: any) => x.walletAddress === owner)
          : [];

        const legacyPending = owner
          ? pendingLegacy.filter((x: any) => x.owner === owner)
          : [];

        setNfts([...ownedTickets, ...legacyOwned]);
        setPendingNfts([...ownedPending, ...legacyPending]);
      } catch (e) {
        setNfts([]);
        setPendingNfts([]);
      }
    };

    loadNfts();

    const onChange = () => loadNfts();
    window.addEventListener("mock_user_nfts_changed", onChange);
    window.addEventListener("veritix_tickets_changed", onChange);
    window.addEventListener("veritix_tickets_pending_changed", onChange);
    window.addEventListener("mock_user_nfts_pending_changed", onChange);
    window.addEventListener("storage", onChange as any);
    return () => {
      window.removeEventListener("mock_user_nfts_changed", onChange);
      window.removeEventListener("veritix_tickets_changed", onChange);
      window.removeEventListener("veritix_tickets_pending_changed", onChange);
      window.removeEventListener("mock_user_nfts_pending_changed", onChange);
      window.removeEventListener("storage", onChange as any);
    };
  }, [user, mockUser]);

  if (isLoading)
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading profile...</p>
      </div>
    );

  const effectiveUser = user || mockUser;

  if (!effectiveUser) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <ShieldCheck className="w-8 h-8" />
        </div>
        <div>
            <h2 className="text-2xl font-bold font-display">Access Denied</h2>
            <p className="text-muted-foreground">Please log in to view your digital wallet.</p>
        </div>
        <Link href="/login">
          <Button size="lg" className="rounded-full px-8">Login to VeriTix</Button>
        </Link>
      </div>
    );
  }

  const displayName = user
    ? user.nric
    : mockUser?.username || mockUser?.email || "Anonymous";
  const initials = displayName
    ? displayName.charAt(0).toUpperCase()
    : effectiveUser.email
    ? effectiveUser.email.charAt(0).toUpperCase()
    : "A";

  // =================================================================
  // UI RENDER SECTION
  // =================================================================
  return (
    <div className="relative min-h-screen container mx-auto px-4 md:px-6 py-8">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-20 right-0 w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-8">
        
        {/* =======================
            LEFT COLUMN (STICKY)
           ======================= */}
        <div className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
            
            {/* Profile Card */}
            <div className="group relative bg-card/40 border border-white/5 rounded-3xl p-6 backdrop-blur-xl shadow-xl overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-b from-zinc-800 to-black border-2 border-white/10 flex items-center justify-center text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-tr from-emerald-400 to-primary shadow-xl">
                            {initials}
                        </div>
                        <div className="absolute bottom-0 right-0 bg-emerald-500 text-black p-1 rounded-full border-4 border-black">
                            <ShieldCheck className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">{displayName || "Anonymous"}</h2>
                        <div className="flex items-center justify-center gap-2 mt-1">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-xs font-medium text-emerald-400">Verified Identity</span>
                        </div>
                    </div>

                    <div className="w-full bg-black/20 rounded-xl p-3 border border-white/5">
                        <p className="text-[10px] uppercase text-muted-foreground tracking-widest mb-1">Wallet Address</p>
                        <p className="text-xs font-mono text-white/80 truncate">
                             {user?.walletAddress || effectiveUser.email || effectiveUser.username || "0x..."}
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-card/40 border border-white/5 rounded-2xl p-2 backdrop-blur-xl shadow-lg space-y-1">
                 <button
                    onClick={() => setTab("owned")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${tab === 'owned' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-white/5 hover:text-white'}`}
                >
                    <Wallet className="w-4 h-4" />
                    <span>My Wallet</span>
                    {nfts.length > 0 && <span className="ml-auto text-xs bg-primary/20 px-2 py-0.5 rounded-full">{nfts.length}</span>}
                </button>
                 <button
                    onClick={() => setTab("pending")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${tab === 'pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'text-muted-foreground hover:bg-white/5 hover:text-white'}`}
                >
                    <Clock className="w-4 h-4" />
                    <span>Pending Sales</span>
                    {pendingNfts.length > 0 && <span className="ml-auto text-xs bg-amber-500/20 px-2 py-0.5 rounded-full">{pendingNfts.length}</span>}
                </button>
            </div>

            {/* Logout */}
            {user ? (
                <Button variant="outline" className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300" onClick={() => logout()}>
                    <LogOut className="w-4 h-4 mr-2" /> Disconnect
                </Button>
            ) : (
                <Button
                variant="outline"
                className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                onClick={() => {
                    localStorage.removeItem("mock_user");
                    window.dispatchEvent(new Event("mock_user_changed"));
                    window.location.href = "/";
                }}
                >
                    <LogOut className="w-4 h-4 mr-2" /> Disconnect
                </Button>
            )}

        </div>

        {/* =======================
            RIGHT COLUMN (CONTENT)
           ======================= */}
        <div className="space-y-6">
            
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-display font-bold text-white">
                    {tab === 'owned' ? "Digital Assets" : "Marketplace Listings"}
                </h2>
                {/* Mobile Tab Switcher could go here if needed, but sidebar handles it */}
            </div>

            <AnimatePresence mode="wait">
            {tab === "owned" && (
                <motion.div 
                    key="owned"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                >
                {nfts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 border border-dashed border-white/10 rounded-3xl bg-white/5">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                            <Ticket className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-white">Wallet Empty</h3>
                            <p className="text-muted-foreground text-sm">You haven't purchased any NFTs yet.</p>
                        </div>
                        <Link href="/events">
                            <Button variant="secondary">Browse Events</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                    {nfts.map((n, index) => {
                        const title = n.description || n.event?.title || n.ticket?.event?.title || "Ticket";
                        const dateValue = n.purchasedAt || n.purchaseDate || n.createdAt;
                        const location = n.event?.location || n.ticket?.event?.location || "TBA";
                        const priceCents = n.amountCents ?? n.purchasePrice ?? n.price ?? 0;
                        const tokenId = n.tokenId || n.nftTokenId || n.nftokenId;

                        return (
                        <div
                            key={`${n.id ?? "ticket"}-${index}`}
                            className="group flex flex-col md:flex-row items-center gap-6 bg-card/40 border border-white/5 rounded-2xl p-4 md:p-5 hover:border-emerald-500/30 hover:bg-white/5 transition-all"
                        >
                            {/* Icon / Thumbnail */}
                            <div className="shrink-0 w-full md:w-20 h-20 rounded-xl bg-gradient-to-br from-emerald-500/10 to-black border border-white/10 flex items-center justify-center">
                                <Ticket className="w-8 h-8 text-emerald-500" />
                            </div>

                            {/* Main Info */}
                            <div className="flex-1 text-center md:text-left space-y-1 w-full">
                                <div className="flex items-center justify-center md:justify-start gap-2">
                                     <h3 className="font-bold text-white text-lg">{title}</h3>
                                     <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-muted-foreground font-mono">
                                        #{tokenId?.slice(-4) || "WAIT"}
                                     </span>
                                </div>
                                
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> 
                                        {dateValue ? new Date(dateValue).toLocaleDateString() : "TBA"}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {location}
                                    </span>
                                </div>
                            </div>

                            {/* Actions / Price */}
                            <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
                                <div className="text-right">
                                    <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Value</p>
                                    <p className="font-mono text-white">{(priceCents / 100).toFixed(2)} SGD</p>
                                </div>
                                <Button
                                    size="sm"
                                    className="w-full md:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/5"
                                    onClick={() => {
                                        try {
                                            const nftPriceCents = n.amountCents ?? n.purchasePrice ?? (n.price ? Math.round(n.price) : undefined);
                                            if (!nftPriceCents || nftPriceCents <= 0) {
                                                toast({ title: "Cannot list", description: "This NFT has no valid price to list", variant: "destructive" });
                                                return;
                                            }
                                            setTicketToList(n);
                                            setTicketPriceCents(nftPriceCents);
                                            setConfirmOpen(true);
                                        } catch (e) {
                                            toast({ title: "Listing failed", description: "Could not list NFT", variant: "destructive" });
                                        }
                                    }}
                                    disabled={listingInProgress}
                                >
                                    Sell Ticket
                                </Button>
                            </div>
                        </div>
                        );
                    })}
                    </div>
                )}
                </motion.div>
            )}

            {tab === "pending" && (
                <motion.div 
                    key="pending"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                >
                {pendingNfts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 border border-dashed border-white/10 rounded-3xl bg-white/5">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                            <LayoutGrid className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-white">No Active Listings</h3>
                            <p className="text-muted-foreground text-sm">You don't have any tickets pending sale.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                    {pendingNfts.map((n, index) => {
                        const title = n.description || n.event?.title || n.ticket?.event?.title || "Ticket";
                        const dateValue = n.purchasedAt || n.purchaseDate || n.createdAt;
                        const location = n.event?.location || n.ticket?.event?.location || "TBA";
                        const priceCents = n.amountCents ?? n.purchasePrice ?? n.price ?? 0;

                        return (
                        <div
                            key={`${n.id ?? "pending"}-${index}`}
                            className="group flex flex-col md:flex-row items-center gap-6 bg-card/40 border border-amber-500/20 rounded-2xl p-4 md:p-5 relative overflow-hidden"
                        >
                            {/* Ambient Glow */}
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />

                            <div className="relative z-10 shrink-0 w-full md:w-20 h-20 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                <Clock className="w-8 h-8 text-amber-500" />
                            </div>

                            <div className="relative z-10 flex-1 text-center md:text-left space-y-1 w-full">
                                <div className="flex items-center justify-center md:justify-start gap-2">
                                     <h3 className="font-bold text-white text-lg">{title}</h3>
                                     <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 font-bold uppercase tracking-wider animate-pulse">
                                        Listing Active
                                     </span>
                                </div>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> 
                                        {dateValue ? new Date(dateValue).toLocaleDateString() : "TBA"}
                                    </span>
                                </div>
                            </div>

                            <div className="relative z-10 flex flex-col items-center md:items-end gap-3 w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
                                <div className="text-right">
                                    <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Listed Price</p>
                                    <p className="font-mono text-amber-400">{(priceCents / 100).toFixed(2)} SGD</p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full md:w-auto border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                    onClick={() => {
                                        // LOGIC FOR REMOVING (Copied strictly from original)
                                        const matchTokenId = n.tokenId || n.nftTokenId || n.nftokenId;
                                        const matchOrderId = n.orderId;
                                        const matchLegacyId = n.id;
                                        const matchWallet = n.walletAddress;
                                        const matchPurchasedAt = n.purchasedAt || n.purchaseDate || n.createdAt;
                                        const shouldRemove = (x: any) => {
                                            const candidateTokenId = x.tokenId || x.nftTokenId || x.nftokenId;

                                            // PRIORITY 1: If both have tokenId, use ONLY tokenId (exclusive)
                                            if (matchTokenId && candidateTokenId) {
                                                return matchTokenId === candidateTokenId;
                                            }

                                            // PRIORITY 2: Legacy id (only if no tokenId on either side)
                                            if (!matchTokenId && !candidateTokenId && matchLegacyId !== undefined) {
                                                return x.id === matchLegacyId;
                                            }

                                            // PRIORITY 3: Composite key (only if no tokenId AND no legacy id)
                                            if (!matchTokenId && !candidateTokenId && !matchLegacyId) {
                                                if (matchWallet && matchPurchasedAt && x.walletAddress === matchWallet &&
                                                    (x.purchasedAt === matchPurchasedAt || x.purchaseDate === matchPurchasedAt || x.createdAt === matchPurchasedAt)) {
                                                    return true;
                                                }
                                            }

                                            // PRIORITY 4: orderId (absolute last resort)
                                            if (!matchTokenId && !candidateTokenId && !matchLegacyId && matchOrderId) {
                                                return x.orderId === matchOrderId;
                                            }

                                            return false;
                                        };

                                        try {
                                            const pendingRaw = localStorage.getItem("veritix_tickets_pending");
                                            const pendingArr = pendingRaw ? JSON.parse(pendingRaw) : [];
                                            const pendingNext = pendingArr.filter((x: any) => !shouldRemove(x));
                                            localStorage.setItem("veritix_tickets_pending", JSON.stringify(pendingNext));

                                            const pendingLegacyRaw = localStorage.getItem("mock_user_nfts_pending");
                                            const pendingLegacyArr = pendingLegacyRaw ? JSON.parse(pendingLegacyRaw) : [];
                                            const pendingLegacyNext = pendingLegacyArr.filter((x: any) => !shouldRemove(x));
                                            localStorage.setItem("mock_user_nfts_pending", JSON.stringify(pendingLegacyNext));

                                            if (n.walletAddress) {
                                                const ownedRaw = localStorage.getItem("veritix_tickets");
                                                const ownedArr = ownedRaw ? JSON.parse(ownedRaw) : [];
                                                ownedArr.push({ ...n, restoredAt: new Date().toISOString() });
                                                localStorage.setItem("veritix_tickets", JSON.stringify(ownedArr));
                                                window.dispatchEvent(new Event("veritix_tickets_changed"));
                                            } else {
                                                const legacyRaw = localStorage.getItem("mock_user_nfts");
                                                const legacyArr = legacyRaw ? JSON.parse(legacyRaw) : [];
                                                legacyArr.push({ ...n, restoredAt: new Date().toISOString() });
                                                localStorage.setItem("mock_user_nfts", JSON.stringify(legacyArr));
                                                window.dispatchEvent(new Event("mock_user_nfts_changed"));
                                            }

                                            const listingsRaw = localStorage.getItem("mock_listings");
                                            const listingsArr = listingsRaw ? JSON.parse(listingsRaw) : [];
                                            const listingsNext = listingsArr.filter((x: any) => x.ticket?.tokenId !== matchTokenId && x.ticket?.orderId !== matchOrderId);
                                            localStorage.setItem("mock_listings", JSON.stringify(listingsNext));

                                            window.dispatchEvent(new Event("mock_listings_changed"));
                                            window.dispatchEvent(new Event("veritix_tickets_pending_changed"));
                                            window.dispatchEvent(new Event("mock_user_nfts_pending_changed"));

                                            toast({ title: "Listing removed", description: "Ticket moved back to My Tickets." });
                                        } catch (e) {
                                            toast({ title: "Remove failed", description: "Could not remove listing from marketplace.", variant: "destructive" });
                                        }
                                    }}
                                >
                                    Cancel Listing
                                </Button>
                            </div>
                        </div>
                        );
                    })}
                    </div>
                )}
                </motion.div>
            )}
            </AnimatePresence>
        </div>
      </div>

      {/* Confirmation Modal (UNTOUCHED LOGIC) */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display text-white">
              List ticket for resale
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This will create a public listing on the marketplace.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4 flex gap-4 items-center">
               <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Ticket className="w-6 h-6 text-emerald-500" />
               </div>
               <div>
                    <div className="text-sm font-semibold text-white">
                        {ticketToList?.description || ticketToList?.event?.title || "Ticket"}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                        Listing Price: <span className="text-emerald-400 font-mono">{(ticketPriceCents / 100).toFixed(2)} SGD</span>
                    </div>
               </div>
            </div>
            <p className="text-xs text-muted-foreground bg-amber-500/10 text-amber-500 p-3 rounded-lg">
                Note: A 2% marketplace fee will be deducted upon successful sale.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} className="hover:bg-white/5">
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={async () => {
                // LOGIC: LISTING (Copied strictly from original)
                if (!ticketToList) return;
                const n = ticketToList;
                const nftPriceCents = ticketPriceCents;
                setConfirmOpen(false);
                setListingInProgress(true);

                try {
                  const raw = localStorage.getItem("mock_listings");
                  const existing = raw ? JSON.parse(raw) : [];
                  const nextId = (existing.length > 0 ? Math.max(...existing.map((x: any) => x.id)) : 1000) + 1;
                  const sellerName = user ? user.nric || user.walletAddress : mockUser?.username || mockUser?.email || "Anonymous";

                  const ticketWithEvent = {
                    ...n,
                    id: nextId + 100,
                    seat: n.seat || n.ticket?.seat || n.seat || undefined,
                    event: n.event || {
                      id: n.eventId || 0,
                      title: n.description || "NFT",
                      description: n.description || "",
                      location: n.location || "Unknown",
                      date: n.date || new Date().toISOString(),
                      price: n.price || 0,
                      imageUrl: n.imageUrl || n.image?.url || (n.event && n.event.imageUrl) || "",
                      availableTickets: n.availableTickets || 0,
                      totalTickets: n.totalTickets || 0,
                      createdAt: n.createdAt || new Date().toISOString(),
                    },
                  };

                  const listing = {
                    id: nextId,
                    ticket: ticketWithEvent,
                    price: nftPriceCents,
                    sellerName,
                  };

                  existing.push(listing);
                  localStorage.setItem("mock_listings", JSON.stringify(existing));

                  const pendingTicket = {
                    ...n,
                    pendingListedAt: new Date().toISOString(),
                  };

                  if (n.walletAddress) {
                    const pendingRaw = localStorage.getItem("veritix_tickets_pending");
                    const pendingArr = pendingRaw ? JSON.parse(pendingRaw) : [];
                    pendingArr.push(pendingTicket);
                    localStorage.setItem("veritix_tickets_pending", JSON.stringify(pendingArr));
                  } else {
                    const pendingLegacyRaw = localStorage.getItem("mock_user_nfts_pending");
                    const pendingLegacyArr = pendingLegacyRaw ? JSON.parse(pendingLegacyRaw) : [];
                    pendingLegacyArr.push(pendingTicket);
                    localStorage.setItem("mock_user_nfts_pending", JSON.stringify(pendingLegacyArr));
                  }

                  const matchTokenId = n.tokenId || n.nftTokenId || n.nftokenId;
                  const matchOrderId = n.orderId;
                  const matchLegacyId = n.id;
                  const matchWallet = n.walletAddress;
                  const matchPurchasedAt = n.purchasedAt || n.purchaseDate || n.createdAt;
                  const shouldRemove = (x: any) => {
                    const candidateTokenId = x.tokenId || x.nftTokenId || x.nftokenId;

                    // PRIORITY 1: If both have tokenId, use ONLY tokenId (exclusive)
                    if (matchTokenId && candidateTokenId) {
                      return matchTokenId === candidateTokenId;
                    }

                    // PRIORITY 2: Legacy id (only if no tokenId on either side)
                    if (!matchTokenId && !candidateTokenId && matchLegacyId !== undefined) {
                      return x.id === matchLegacyId;
                    }

                    // PRIORITY 3: Composite key (only if no tokenId AND no legacy id)
                    if (!matchTokenId && !candidateTokenId && !matchLegacyId) {
                      if (matchWallet && matchPurchasedAt && x.walletAddress === matchWallet &&
                          (x.purchasedAt === matchPurchasedAt || x.purchaseDate === matchPurchasedAt || x.createdAt === matchPurchasedAt)) {
                        return true;
                      }
                    }

                    // PRIORITY 4: orderId (absolute last resort)
                    if (!matchTokenId && !candidateTokenId && !matchLegacyId && matchOrderId) {
                      return x.orderId === matchOrderId;
                    }

                    return false;
                  };

                  const nftRaw = localStorage.getItem("mock_user_nfts");
                  const nftArr = nftRaw ? JSON.parse(nftRaw) : [];
                  const newArr = nftArr.filter((x: any) => !shouldRemove(x));
                  localStorage.setItem("mock_user_nfts", JSON.stringify(newArr));

                  if (n.walletAddress) {
                    const ownedRaw = localStorage.getItem("veritix_tickets");
                    const ownedArr = ownedRaw ? JSON.parse(ownedRaw) : [];
                    const ownedNext = ownedArr.filter((x: any) => !shouldRemove(x));
                    localStorage.setItem("veritix_tickets", JSON.stringify(ownedNext));
                  }

                  window.dispatchEvent(new Event("mock_listings_changed"));
                  window.dispatchEvent(new Event("mock_user_nfts_changed"));
                  window.dispatchEvent(new Event("veritix_tickets_changed"));
                  window.dispatchEvent(new Event("veritix_tickets_pending_changed"));
                  window.dispatchEvent(new Event("mock_user_nfts_pending_changed"));
                  toast({ title: "Listing created", description: "Your NFT is now listed on the marketplace" });
                } catch (e) {
                  toast({ title: "Listing failed", description: "Could not list NFT", variant: "destructive" });
                } finally {
                  setListingInProgress(false);
                }
              }}
              disabled={listingInProgress}
            >
              Confirm Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}