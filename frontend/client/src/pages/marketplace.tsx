import { MOCK_LISTINGS } from "@/lib/mock-data";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowUpDown, Ticket, Plus, Wallet, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "price">("recent");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [recentDirection, setRecentDirection] = useState<"asc" | "desc">("desc");
  const [userListings, setUserListings] = useState<any[]>([]);
  const [removedListings, setRemovedListings] = useState<number[]>([]);

  // =================================================================
  // DATA LOADING LOGIC (UNTOUCHED)
  // =================================================================
  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem('mock_listings');
        const arr = raw ? JSON.parse(raw) : [];
        setUserListings(arr);
        try {
          const removedRaw = localStorage.getItem('mock_listings_removed');
          const removed = removedRaw ? JSON.parse(removedRaw) : [];
          setRemovedListings(removed);
        } catch (e) {
          setRemovedListings([]);
        }
      } catch (e) {
        setUserListings([]);
      }
    };

    load();
    window.addEventListener('mock_listings_changed', load);
    window.addEventListener('storage', load as any);
    return () => {
      window.removeEventListener('mock_listings_changed', load);
      window.removeEventListener('storage', load as any);
    };
  }, []);

  const allListings = [...userListings, ...MOCK_LISTINGS].filter(l => !removedListings.includes(l.id));

  const filteredListings = allListings
    .filter(l => {
      const title = l?.ticket?.event?.title ?? l?.ticket?.title ?? "";
      const seller = l?.sellerName ?? "";
      return (
        title.toLowerCase().includes(search.toLowerCase()) ||
        seller.toLowerCase().includes(search.toLowerCase())
      );
    })
    .sort((a, b) => {
      if (sortBy === "price") {
        return sortDirection === "asc" ? a.price - b.price : b.price - a.price;
      }
      const aTime = new Date(a?.ticket?.event?.date ?? a?.ticket?.date ?? 0).getTime();
      const bTime = new Date(b?.ticket?.event?.date ?? b?.ticket?.date ?? 0).getTime();
      return recentDirection === "asc" ? aTime - bTime : bTime - aTime;
    });

  const { isAuthenticated, user } = useAuth();
  const [mockUser] = useState(() => {
    try {
      const raw = localStorage.getItem("mock_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const getInitials = (value: string) => {
    const cleaned = value.replace(/[^a-zA-Z0-9 ]/g, "").trim();
    if (!cleaned) return "VT";
    const parts = cleaned.split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]).join("").toUpperCase();
  };

  const currentUserLabels = [
    user?.nric,
    user?.walletAddress,
    mockUser?.username,
    mockUser?.email,
  ].filter(Boolean) as string[];

  const isCurrentUserListing = (sellerName?: string) =>
    !!sellerName && currentUserLabels.includes(sellerName);

  const otherListings = filteredListings.filter(
    (listing) => !isCurrentUserListing(listing?.sellerName)
  );
  const userListingsView = filteredListings.filter((listing) =>
    isCurrentUserListing(listing?.sellerName)
  );

  const removeFromPending = (ticket: any) => {
    const matchTokenId = ticket?.tokenId || ticket?.nftTokenId || ticket?.nftokenId;
    const matchOrderId = ticket?.orderId;
    const matchWallet = ticket?.walletAddress;
    const matchPurchasedAt =
      ticket?.purchasedAt || ticket?.purchaseDate || ticket?.createdAt;
    const shouldRemove = (x: any) => {
      const candidateTokenId = x.tokenId || x.nftTokenId || x.nftokenId;

      if (matchTokenId && candidateTokenId) {
        return matchTokenId === candidateTokenId;
      }

      if (!matchTokenId && !candidateTokenId) {
        if (matchWallet && matchPurchasedAt && x.walletAddress === matchWallet &&
            (x.purchasedAt === matchPurchasedAt || x.purchaseDate === matchPurchasedAt || x.createdAt === matchPurchasedAt)) {
          return true;
        }
      }

      if (!matchTokenId && !candidateTokenId && matchOrderId) {
        return x.orderId === matchOrderId;
      }

      return false;
    };

    const pendingRaw = localStorage.getItem("veritix_tickets_pending");
    const pendingArr = pendingRaw ? JSON.parse(pendingRaw) : [];
    const pendingNext = pendingArr.filter((x: any) => !shouldRemove(x));
    localStorage.setItem("veritix_tickets_pending", JSON.stringify(pendingNext));

    const pendingLegacyRaw = localStorage.getItem("mock_user_nfts_pending");
    const pendingLegacyArr = pendingLegacyRaw ? JSON.parse(pendingLegacyRaw) : [];
    const pendingLegacyNext = pendingLegacyArr.filter((x: any) => !shouldRemove(x));
    localStorage.setItem(
      "mock_user_nfts_pending",
      JSON.stringify(pendingLegacyNext)
    );
  };

  const handleRemoveListing = (listing: any) => {
    const ticket = listing?.ticket || {};

    try {
      const raw = localStorage.getItem("mock_listings");
      const existing = raw ? JSON.parse(raw) : [];
      const remaining = existing.filter((x: any) => x.id !== listing.id);
      localStorage.setItem("mock_listings", JSON.stringify(remaining));

      removeFromPending(ticket);

      if (ticket.walletAddress || user?.walletAddress) {
        const ownedRaw = localStorage.getItem("veritix_tickets");
        const ownedArr = ownedRaw ? JSON.parse(ownedRaw) : [];
        const restored = {
          ...ticket,
          walletAddress: ticket.walletAddress || user?.walletAddress,
          restoredAt: new Date().toISOString(),
        };
        ownedArr.push(restored);
        localStorage.setItem("veritix_tickets", JSON.stringify(ownedArr));
        window.dispatchEvent(new Event("veritix_tickets_changed"));
      } else {
        const legacyRaw = localStorage.getItem("mock_user_nfts");
        const legacyArr = legacyRaw ? JSON.parse(legacyRaw) : [];
        legacyArr.push({ ...ticket, restoredAt: new Date().toISOString() });
        localStorage.setItem("mock_user_nfts", JSON.stringify(legacyArr));
        window.dispatchEvent(new Event("mock_user_nfts_changed"));
      }

      window.dispatchEvent(new Event("mock_listings_changed"));
      window.dispatchEvent(new Event("veritix_tickets_pending_changed"));
      window.dispatchEvent(new Event("mock_user_nfts_pending_changed"));
    } catch {
      // Ignore for demo
    }
  };

  // =================================================================
  // UI RENDER
  // =================================================================
  return (
    <div className="relative min-h-screen pb-20">
      {/* Fixed Background Gradients */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 md:px-6 space-y-6 pt-8">
        
        {/* Header */}
        <motion.section
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <div className="bg-card/30 backdrop-blur-xl border border-white/5 rounded-2xl p-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-white">
                Marketplace
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Verified secondary market on the XRP Ledger.
              </p>
            </div>
            <Link href="/profile">
               <Button className="gap-2 hidden md:flex">
                  <Wallet className="w-4 h-4" /> My Wallet
               </Button>
            </Link>
          </div>
        </motion.section>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: PUBLIC MARKETPLACE (span 8 or 9) */}
            <div className="lg:col-span-9 space-y-4">
                
                {/* Search & Sort Toolbar */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-card/20 p-4 rounded-xl border border-white/5"
                >
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search events, seats, or sellers..." 
                            className="pl-10 bg-black/20 border-white/10 rounded-lg h-10 text-sm focus:ring-primary/20"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground hidden sm:inline">Sort by:</span>
                        <Button 
                            variant={sortBy === "recent" ? "secondary" : "ghost"} 
                            size="sm" 
                            className="h-8 text-xs"
                            onClick={() => {
                                if (sortBy !== "recent") {
                                    setSortBy("recent");
                                    setRecentDirection("desc");
                                } else {
                                    setRecentDirection((prev) => (prev === "asc" ? "desc" : "asc"));
                                }
                            }}
                        >
                        Recent {recentDirection === "asc" ? "↑" : "↓"}
                        </Button>
                        <Button 
                            variant={sortBy === "price" ? "secondary" : "ghost"} 
                            size="sm" 
                            className="h-8 text-xs"
                            onClick={() => {
                                if (sortBy !== "price") {
                                    setSortBy("price");
                                    setSortDirection("asc");
                                } else {
                                    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
                                }
                            }}
                        >
                        Price {sortDirection === "asc" ? "↑" : "↓"}
                        </Button>
                    </div>
                </motion.div>

                {/* Main Listings Table/Rows */}
                <div className="space-y-2 min-h-[500px]">
                    {/* Header Row */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-[10px] text-muted-foreground uppercase tracking-widest border-b border-white/5">
                        <div className="col-span-5">Event Details</div>
                        <div className="col-span-2">Seat</div>
                        <div className="col-span-3">Seller</div>
                        <div className="col-span-2 text-right">Price</div>
                    </div>

                    {otherListings.length === 0 ? (
                         <div className="text-center py-20 text-muted-foreground bg-card/10 rounded-xl border border-dashed border-white/10">
                            <Ticket className="w-10 h-10 mx-auto mb-3 opacity-20" />
                            <p>No listings found matching your search.</p>
                         </div>
                    ) : (
                        otherListings.map((listing, i) => {
                        const ev = listing?.ticket?.event ?? listing?.ticket ?? { title: 'Unknown Event', imageUrl: '', date: new Date().toISOString() };
                        const seat = listing?.ticket?.seat ?? 'General';
                        const sellerName = listing?.sellerName ?? 'Anonymous';
                        const seller = isCurrentUserListing(sellerName) ? "You" : sellerName;
                        const price = typeof listing?.price === 'number' ? listing.price : 0;
                        
                        return (
                            <motion.div
                            key={listing.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.03 }}
                            className="group bg-card/40 hover:bg-card/60 backdrop-blur-sm border border-white/5 hover:border-emerald-500/20 rounded-xl p-3 md:p-4 transition-all duration-200"
                            >
                            <div className="grid grid-cols-12 gap-3 md:gap-4 items-center">
                                {/* Event Info */}
                                <div className="col-span-12 md:col-span-5 flex items-center gap-3 md:gap-4">
                                <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                                    {ev.imageUrl ? (
                                    <img src={ev.imageUrl} alt={ev.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                    ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-xs text-emerald-200">{getInitials(ev.title)}</div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h3 className="font-semibold text-white truncate text-sm md:text-base">{ev.title}</h3>
                                        <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-400 hidden lg:inline-flex">Verified</Badge>
                                    </div>
                                    <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                                    {(() => { try { return format(new Date(ev.date), "MMM d, yyyy • h:mm a"); } catch { return 'TBD'; } })()}
                                    </p>
                                </div>
                                </div>

                                {/* Seat */}
                                <div className="col-span-6 md:col-span-2 flex flex-col justify-center">
                                    <span className="md:hidden text-[9px] text-muted-foreground uppercase">Seat</span>
                                    <span className="font-mono text-xs text-white bg-white/5 md:bg-transparent px-2 py-1 md:p-0 rounded-md w-fit">{seat}</span>
                                </div>

                                {/* Seller */}
                                <div className="col-span-6 md:col-span-3 flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[9px] font-bold text-white">
                                        {getInitials(seller)}
                                    </div>
                                    <span className="text-xs text-muted-foreground truncate">{seller}</span>
                                </div>

                                {/* Price & Action */}
                                <div className="col-span-12 md:col-span-2 flex items-center justify-between md:flex-col md:items-end md:justify-center gap-2">
                                    <div className="text-right">
                                        <p className="md:hidden text-[9px] text-muted-foreground uppercase">Price</p>
                                        <p className="text-sm md:text-lg font-bold text-emerald-400">${(price / 100).toFixed(2)}</p>
                                    </div>
                                    
                                    {isAuthenticated || (typeof window !== 'undefined' && !!(() => { try { const r = localStorage.getItem('mock_user'); return r ? JSON.parse(r).username : null } catch { return null } })()) ? (
                                        <Link href={`/payment?listingId=${listing.id}`} className="w-full md:w-auto">
                                            <Button size="sm" className="w-full h-8 text-xs font-bold bg-white text-black hover:bg-white/90">Buy</Button>
                                        </Link>
                                    ) : (
                                        <Link href={`/login?next=${encodeURIComponent(`/payment?listingId=${listing.id}`)}`} className="w-full md:w-auto">
                                            <Button size="sm" className="w-full h-8 text-xs font-bold bg-white text-black hover:bg-white/90">Buy</Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                            </motion.div>
                        );
                        })
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN: USER LISTINGS SIDEBAR (span 4 or 3) */}
            <div className="lg:col-span-3 space-y-4">
                <div className="sticky top-24 space-y-4">
                    <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-xl">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                            <h2 className="font-display font-bold text-lg text-white">Your Listings</h2>
                            <Badge variant="outline" className="border-amber-500/50 text-amber-500 bg-amber-500/10">
                                {userListingsView.length} Active
                            </Badge>
                        </div>

                        <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-1 custom-scrollbar">
                            <AnimatePresence>
                                {userListingsView.length > 0 ? (
                                    userListingsView.map((listing) => {
                                        const ev = listing?.ticket?.event ?? listing?.ticket ?? { title: 'Unknown', imageUrl: '' };
                                        const price = typeof listing?.price === 'number' ? listing.price : 0;
                                        
                                        return (
                                            <motion.div
                                                key={listing.id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                className="group relative bg-black/40 border border-white/5 hover:border-red-500/30 rounded-lg p-3 transition-colors"
                                            >
                                                <div className="flex gap-3">
                                                    {/* Thumbnail */}
                                                    <div className="w-12 h-12 rounded bg-white/5 flex-shrink-0 overflow-hidden">
                                                        {ev.imageUrl ? (
                                                            <img src={ev.imageUrl} alt="" className="w-full h-full object-cover opacity-80" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[9px]">{getInitials(ev.title)}</div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-xs font-semibold text-white truncate leading-tight mb-1">{ev.title}</h4>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-mono text-emerald-400">${(price / 100).toFixed(2)}</span>
                                                            <Button 
                                                                size="icon" 
                                                                variant="ghost" 
                                                                className="h-6 w-6 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                                                                onClick={() => handleRemoveListing(listing)}
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )
                                    })
                                ) : (
                                    <div className="text-center py-8 px-4 bg-white/5 rounded-lg border border-dashed border-white/10">
                                        <p className="text-xs text-muted-foreground mb-3">You are not selling any tickets.</p>
                                        <Link href="/profile">
                                            <Button size="sm" variant="outline" className="w-full text-xs h-8 border-white/10 hover:bg-white/5">
                                                <Plus className="w-3 h-3 mr-1" /> List Ticket
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-white/5 text-center">
                        <p className="text-xs text-indigo-200 mb-2">Want to sell a ticket?</p>
                        <Link href="/profile">
                            <Button size="sm" className="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-xs">
                                Go to Wallet
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}