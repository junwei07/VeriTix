import { MOCK_LISTINGS } from "@/lib/mock-data";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, ArrowUpDown, Ticket } from "lucide-react";
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
      if (matchTokenId && x.tokenId === matchTokenId) return true;
      if (matchOrderId && x.orderId === matchOrderId) return true;
      if (
        matchWallet &&
        matchPurchasedAt &&
        x.walletAddress === matchWallet &&
        (x.purchasedAt === matchPurchasedAt ||
          x.purchaseDate === matchPurchasedAt ||
          x.createdAt === matchPurchasedAt)
      ) {
        return true;
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

  return (
    <div className="relative min-h-screen pb-20">
      {/* Fixed Background Gradients */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[100px]" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-blue-500/5 blur-[80px]" />
      </div>

      <div className="container mx-auto px-4 md:px-6 space-y-6 pt-8">
        
        <motion.section
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <div className="bg-card/30 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-white">
              Marketplace
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              List tickets you can’t make it to, or grab a verified second-hand transfer.
            </p>
          </div>
        </motion.section>

        {/* Trading Toolbar */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between"
        >
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search events or sellers..." 
              className="pl-10 bg-card/50 border-white/10 rounded-lg h-10 text-sm focus:ring-primary/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="flex gap-1">
              <Button 
                variant={sortBy === "recent" ? "secondary" : "ghost"} 
                size="sm" 
                className="rounded-lg text-[10px] md:text-xs h-8 px-2 md:px-3 whitespace-nowrap flex items-center gap-1"
                onClick={() => {
                  if (sortBy !== "recent") {
                    setSortBy("recent");
                    setRecentDirection("desc");
                  } else {
                    setRecentDirection((prev) => (prev === "asc" ? "desc" : "asc"));
                  }
                }}
              >
                Recent
                <span className="text-[10px] md:text-xs">
                  {recentDirection === "asc" ? "↑" : "↓"}
                </span>
              </Button>
              <Button 
                variant={sortBy === "price" ? "secondary" : "ghost"} 
                size="sm" 
                className="rounded-lg text-[10px] md:text-xs h-8 px-2 md:px-3 whitespace-nowrap flex items-center gap-1"
                onClick={() => {
                  if (sortBy !== "price") {
                    setSortBy("price");
                    setSortDirection("asc");
                  } else {
                    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
                  }
                }}
              >
                Price
                <span className="text-[10px] md:text-xs">
                  {sortDirection === "asc" ? "↑" : "↓"}
                </span>
              </Button>
            </div>
          </div>
        </motion.section>

        {/* Asset-Style Row Listings */}
        <section className="space-y-3">
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs text-muted-foreground uppercase tracking-wide border-b border-white/5">
            <div className="col-span-5">Event</div>
            <div className="col-span-2">Seat</div>
            <div className="col-span-2">Seller</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-1"></div>
          </div>

          <div className="space-y-2">
            {otherListings.map((listing, i) => {
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
                  className="group bg-card/40 hover:bg-card/60 backdrop-blur-sm border border-white/5 hover:border-white/10 rounded-xl p-3 md:p-4 transition-all duration-200"
                >
                  <div className="grid grid-cols-12 gap-3 md:gap-4 items-center">
                    {/* Event Info with Thumbnail */}
                    <div className="col-span-12 md:col-span-5 flex items-center gap-3 md:gap-4">
                      <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                        {ev.imageUrl ? (
                          <img
                            src={ev.imageUrl}
                            alt={ev.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-xs font-display text-emerald-200">
                            {getInitials(ev.title)}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-semibold text-white truncate text-sm md:text-base group-hover:text-primary transition-colors">
                            {ev.title}
                          </h3>
                          <Badge variant="outline" className="text-[8px] md:text-[10px] border-emerald-500/30 text-emerald-400 hidden xs:inline-flex">
                            Verified
                          </Badge>
                        </div>
                        <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                          {(() => {
                            try {
                              return format(new Date(ev.date), "MMM d, yyyy • h:mm a");
                            } catch {
                              return 'TBD';
                            }
                          })()}
                        </p>
                      </div>
                    </div>

                    {/* Metadata Row (Mobile) */}
                    <div className="col-span-12 md:col-span-6 grid grid-cols-3 gap-2 items-center">
                      {/* Seat */}
                      <div className="flex flex-col">
                        <p className="md:hidden text-[9px] text-muted-foreground uppercase tracking-tight mb-0.5">Seat</p>
                        <p className="font-mono text-xs text-white bg-white/5 rounded-md px-1.5 py-1 text-center md:text-left md:bg-transparent md:px-0 md:py-0">
                          {seat}
                        </p>
                      </div>

                      {/* Seller */}
                      <div className="flex flex-col">
                        <p className="md:hidden text-[9px] text-muted-foreground uppercase tracking-tight mb-0.5">Seller</p>
                        <div className="flex items-center gap-1.5 justify-center md:justify-start">
                          <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center text-[9px] font-semibold text-white">
                            {seller === "You" ? "Y" : getInitials(seller)}
                          </div>
                          <span className="text-xs text-muted-foreground truncate">{seller}</span>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex flex-col md:text-right">
                        <p className="md:hidden text-[9px] text-muted-foreground uppercase tracking-tight mb-0.5">Price</p>
                        <p className="text-sm md:text-lg font-bold text-emerald-400 text-center md:text-right">
                          ${(price / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="col-span-12 md:col-span-1">
                      {isAuthenticated || (typeof window !== 'undefined' && !!(() => { try { const r = localStorage.getItem('mock_user'); return r ? JSON.parse(r).username : null } catch { return null } })()) ? (
                        <Link href={`/payment?listingId=${listing.id}`}>
                          <Button 
                            size="sm" 
                            className="w-full md:w-auto rounded-lg bg-white text-black hover:bg-white/90 font-bold text-xs h-9 md:h-8 px-4"
                          >
                            Buy
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/login?next=${encodeURIComponent(`/payment?listingId=${listing.id}`)}`}>
                          <Button 
                            size="sm" 
                            className="w-full md:w-auto rounded-lg bg-white text-black hover:bg-white/90 font-bold text-xs h-9 md:h-8 px-4"
                          >
                            Buy
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {otherListings.length === 0 && userListingsView.length === 0 && (
              <div className="text-center py-16 text-muted-foreground bg-card/20 rounded-xl border border-white/5">
                <Ticket className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>{search ? 'No listings found matching your search.' : 'No tickets listed for resale at this time.'}</p>
              </div>
            )}
          </div>
        </section>

        {userListingsView.length > 0 && (
          <section className="space-y-3 pt-6">
            <div className="px-4 py-2 text-xs text-muted-foreground uppercase tracking-wide border-b border-white/5">
              Your Listings
            </div>
            <div className="space-y-2">
              {userListingsView.map((listing, i) => {
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
                    className="group bg-card/40 hover:bg-card/60 backdrop-blur-sm border border-white/5 hover:border-white/10 rounded-xl p-3 md:p-4 transition-all duration-200"
                  >
                    <div className="grid grid-cols-12 gap-3 md:gap-4 items-center">
                      <div className="col-span-12 md:col-span-5 flex items-center gap-3 md:gap-4">
                        <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                          {ev.imageUrl ? (
                            <img
                              src={ev.imageUrl}
                              alt={ev.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-xs font-display text-emerald-200">
                              {getInitials(ev.title)}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-semibold text-white truncate text-sm md:text-base group-hover:text-primary transition-colors">
                              {ev.title}
                            </h3>
                            <Badge variant="outline" className="text-[8px] md:text-[10px] border-amber-500/30 text-amber-300 hidden xs:inline-flex">
                              Your Listing
                            </Badge>
                          </div>
                          <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                            {(() => {
                              try {
                                return format(new Date(ev.date), "MMM d, yyyy • h:mm a");
                              } catch {
                                return 'TBD';
                              }
                            })()}
                          </p>
                        </div>
                      </div>

                      <div className="col-span-12 md:col-span-6 grid grid-cols-3 gap-2 items-center">
                        <div className="flex flex-col">
                          <p className="md:hidden text-[9px] text-muted-foreground uppercase tracking-tight mb-0.5">Seat</p>
                          <p className="font-mono text-xs text-white bg-white/5 rounded-md px-1.5 py-1 text-center md:text-left md:bg-transparent md:px-0 md:py-0">
                            {seat}
                          </p>
                        </div>

                        <div className="flex flex-col">
                          <p className="md:hidden text-[9px] text-muted-foreground uppercase tracking-tight mb-0.5">Seller</p>
                          <div className="flex items-center gap-1.5 justify-center md:justify-start">
                            <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center text-[9px] font-semibold text-white">
                              {seller === "You" ? "Y" : getInitials(seller)}
                            </div>
                            <span className="text-xs text-muted-foreground truncate">{seller}</span>
                          </div>
                        </div>

                        <div className="flex flex-col md:text-right">
                          <p className="md:hidden text-[9px] text-muted-foreground uppercase tracking-tight mb-0.5">Price</p>
                          <p className="text-sm md:text-lg font-bold text-emerald-400 text-center md:text-right">
                            ${(price / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="col-span-12 md:col-span-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-full md:w-auto rounded-lg font-bold text-xs h-9 md:h-8 px-4"
                          onClick={() => handleRemoveListing(listing)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
