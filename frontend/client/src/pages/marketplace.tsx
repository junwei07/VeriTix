import { MOCK_LISTINGS } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { Search, TrendingUp, BarChart3, Wallet, ArrowUpDown, Ticket, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "price-low" | "price-high">("recent");

  const filteredListings = MOCK_LISTINGS
    .filter(l => 
      l.ticket.event.title.toLowerCase().includes(search.toLowerCase()) || 
      l.sellerName.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      return 0;
    });

  const stats = [
    { label: "24h Volume", value: "12,450 XRP", change: "+12.5%", icon: TrendingUp, color: "text-emerald-400" },
    { label: "Avg. Price", value: "45.00 SGD", change: "-2.1%", icon: BarChart3, color: "text-purple-400" },
    { label: "Active Listings", value: "1,204", change: "+5.4%", icon: Wallet, color: "text-blue-400" },
    { label: "Traders (24h)", value: "328", change: "+8.2%", icon: User, color: "text-orange-400" },
  ];

  const { isAuthenticated } = useAuth();

  return (
    <div className="relative min-h-screen pb-20">
      {/* Fixed Background Gradients */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[100px]" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-blue-500/5 blur-[80px]" />
      </div>

      <div className="container mx-auto px-4 md:px-6 space-y-6 pt-8">
        
        {/* Dashboard Header - Full Width Stats */}
        <motion.section 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <div className="bg-card/30 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-display font-bold text-white">
                  Secondary Market
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Real-time ticket trading on XRP Ledger
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Live Trading
              </div>
            </div>
            
            {/* Full Width Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="bg-white/5 border border-white/5 rounded-xl p-3 md:p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 ${stat.color}`}>
                      <stat.icon className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] md:text-[11px] text-muted-foreground uppercase tracking-wide truncate">{stat.label}</p>
                      <div className="flex items-baseline gap-1 md:gap-2">
                        <p className="font-bold text-white text-sm md:text-lg truncate">{stat.value}</p>
                        <span className={`text-[8px] md:text-[10px] font-medium ${stat.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                          {stat.change}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
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
                className="rounded-lg text-[10px] md:text-xs h-8 px-2 md:px-3 whitespace-nowrap"
                onClick={() => setSortBy("recent")}
              >
                Recent
              </Button>
              <Button 
                variant={sortBy === "price-low" ? "secondary" : "ghost"} 
                size="sm" 
                className="rounded-lg text-[10px] md:text-xs h-8 px-2 md:px-3 whitespace-nowrap"
                onClick={() => setSortBy("price-low")}
              >
                Price ↑
              </Button>
              <Button 
                variant={sortBy === "price-high" ? "secondary" : "ghost"} 
                size="sm" 
                className="rounded-lg text-[10px] md:text-xs h-8 px-2 md:px-3 whitespace-nowrap"
                onClick={() => setSortBy("price-high")}
              >
                Price ↓
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
            {filteredListings.map((listing, i) => (
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
                      <img
                        src={listing.ticket.event.imageUrl || ""}
                        alt={listing.ticket.event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-white truncate text-sm md:text-base group-hover:text-primary transition-colors">
                          {listing.ticket.event.title}
                        </h3>
                        <Badge variant="outline" className="text-[8px] md:text-[10px] border-emerald-500/30 text-emerald-400 hidden xs:inline-flex">
                          Verified
                        </Badge>
                      </div>
                      <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                        {format(new Date(listing.ticket.event.date), "MMM d, yyyy • h:mm a")}
                      </p>
                    </div>
                  </div>

                  {/* Metadata Row (Mobile) */}
                  <div className="col-span-12 md:col-span-6 grid grid-cols-3 gap-2 items-center">
                    {/* Seat */}
                    <div className="flex flex-col">
                      <p className="md:hidden text-[9px] text-muted-foreground uppercase tracking-tight mb-0.5">Seat</p>
                      <p className="font-mono text-xs text-white bg-white/5 rounded-md px-1.5 py-1 text-center md:text-left md:bg-transparent md:px-0 md:py-0">
                        {listing.ticket.seat}
                      </p>
                    </div>

                    {/* Seller */}
                    <div className="flex flex-col">
                      <p className="md:hidden text-[9px] text-muted-foreground uppercase tracking-tight mb-0.5">Seller</p>
                      <div className="flex items-center gap-1.5 justify-center md:justify-start">
                        <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0" />
                        <span className="text-xs text-muted-foreground truncate">{listing.sellerName}</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex flex-col md:text-right">
                      <p className="md:hidden text-[9px] text-muted-foreground uppercase tracking-tight mb-0.5">Price</p>
                      <p className="text-sm md:text-lg font-bold text-emerald-400 text-center md:text-right">
                        ${(listing.price / 100).toFixed(2)}
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
            ))}

            {filteredListings.length === 0 && (
              <div className="text-center py-16 text-muted-foreground bg-card/20 rounded-xl border border-white/5">
                <Ticket className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>{search ? 'No listings found matching your search.' : 'No tickets listed for resale at this time.'}</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}