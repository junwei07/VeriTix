import { useEvents } from "@/hooks/use-events";
import { EventCard } from "@/components/event-card";
import { Loader2, Search, Ticket, Sparkles, TrendingUp, ChevronDown, Mail, Twitter, Facebook, Linkedin, Instagram, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  const { data: events, isLoading, error } = useEvents();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Music", "Tech", "Art", "Workshop", "Networking", "Finance"];

  const filteredEvents = events?.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.location.toLowerCase().includes(search.toLowerCase());
    
    if (selectedCategory === "All") return matchesSearch;
    
    const categoryMatch = 
      e.title.toLowerCase().includes(selectedCategory.toLowerCase()) || 
      e.description.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      (selectedCategory === "Tech" && (e.title.includes("Summit") || e.title.includes("Builders") || e.title.includes("Symposium"))) ||
      (selectedCategory === "Finance" && (e.title.includes("Fintech") || e.title.includes("DeFi"))) ||
      (selectedCategory === "Music" && (e.title.includes("Music") || e.title.includes("Concert") || e.title.includes("Festival")));

    return matchesSearch && categoryMatch;
  });

  const featuredEvents = events?.slice(0, 3) || [];
  const trendingTags = ["Concerts", "Tech Conf", "Crypto Events", "Festivals"];

  return (
    <div className="relative w-full">
      {/* =============================================
        BACKGROUND - Full Viewport Gradients
        =============================================
      */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[100px]" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-blue-500/5 blur-[80px]" />
        <div className="absolute bottom-[30%] left-[20%] w-[400px] h-[400px] rounded-full bg-purple-500/8 blur-[90px]" />
      </div>

      {/* =============================================
        HERO SECTION (100vh / Full Viewport)
        =============================================
      */}
      <section className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-center py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Copy & Search */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8 relative z-10"
            >
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/50 border border-white/10 backdrop-blur-md text-sm text-muted-foreground shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-medium text-emerald-500">Live on XRP Ledger</span>
              </div>

              {/* Main Heading */}
              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold tracking-tighter text-white leading-[0.9]">
                  Tickets. <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-primary">
                    Reimagined.
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
                  VeriTix secures tickets after purchase with verified identity.
                  Coming from Ticketmaster or another partner? Verify in seconds.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/bridge">
                  <Button size="lg" className="gap-2">
                    Verify My Ticket
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/events">
                  <Button size="lg" variant="outline">
                    Explore Partner Events
                  </Button>
                </Link>
              </div>

              {/* Search Block */}
              <div className="space-y-4 max-w-lg">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-primary rounded-xl opacity-20 group-hover:opacity-40 blur transition duration-500" />
                  <div className="relative flex items-center bg-card/50 backdrop-blur-xl border border-white/10 rounded-xl p-2 shadow-2xl">
                    <Search className="ml-3 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder="Search events, artists, or venues..."
                      className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base h-12 placeholder:text-muted-foreground/50"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <Button size="sm" className="hidden sm:flex rounded-lg px-6 font-semibold">
                      Explore
                    </Button>
                  </div>
                </div>

                {/* Trending Tags */}
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span>Trending:</span>
                  {trendingTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSearch(tag)}
                      className="hover:text-primary transition-colors underline decoration-dotted underline-offset-4"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Right Column: Visual Hook (Floating Ticket) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative hidden lg:flex justify-center items-center perspective-1000"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent rounded-full blur-3xl" />
              
              <motion.div
                animate={{ y: [-10, 10, -10], rotateX: [0, 5, 0], rotateY: [0, -5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-80 h-[480px] bg-black/40 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 shadow-2xl flex flex-col justify-between overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <Ticket className="w-10 h-10 text-emerald-400" />
                    <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">Verified</Badge>
                  </div>
                  <div className="h-40 w-full rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-80" />
                  <div>
                    <h3 className="text-2xl font-bold text-white">Neon Horizon</h3>
                    <p className="text-sm text-muted-foreground">Fri, Oct 24 • 8:00 PM</p>
                  </div>
                </div>

                <div className="space-y-3 pt-6 border-t border-dashed border-white/10 relative">
                  <div className="absolute -left-9 -top-3 w-6 h-6 bg-background rounded-full" />
                  <div className="absolute -right-9 -top-3 w-6 h-6 bg-background rounded-full" />

                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">Seat</p>
                      <p className="font-mono text-lg">VIP-01</p>
                    </div>
                    <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ delay: 1, duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs uppercase tracking-widest opacity-50">Scroll</span>
            <ChevronDown className="w-6 h-6" />
          </div>
        </motion.div>
      </section>

      {/* =============================================
        FEATURED CAROUSEL SECTION
        =============================================
      */}
      {events && events.length > 0 && (
        <section className="container mx-auto px-4 md:px-6 py-12 border-b border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-display font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              Featured Events
            </h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">View All</Button>
            </div>
          </div>

          <Carousel className="w-full">
            <CarouselContent className="-ml-4">
              {featuredEvents.map((event) => (
                <CarouselItem key={event.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <div className="p-1">
                    <Card className="bg-card/50 backdrop-blur-sm border-white/10 overflow-hidden hover:border-primary/50 transition-all duration-300 group cursor-pointer">
                      <CardContent className="p-0 relative aspect-[16/9]">
                        <img 
                          src={event.imageUrl || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1000"} 
                          alt={event.title} 
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-4 w-full">
                          <Badge className="mb-2 bg-primary/90 hover:bg-primary">Featured</Badge>
                          <h3 className="text-xl font-bold text-white leading-tight mb-1">{event.title}</h3>
                          <p className="text-sm text-gray-300 line-clamp-1">{event.location}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-4 bg-background/80 backdrop-blur border-white/10" />
            <CarouselNext className="hidden md:flex -right-4 bg-background/80 backdrop-blur border-white/10" />
          </Carousel>
        </section>
      )}

      {/* =============================================
        EVENTS SECTION
        =============================================
      */}
      <section className="container mx-auto px-4 md:px-6 py-24 min-h-screen">
        <div className="space-y-8">
          
          {/* Header & Categories */}
          <div className="flex flex-col space-y-6 border-b border-white/10 pb-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl md:text-4xl font-display font-bold">Upcoming Events</h2>
                <p className="text-muted-foreground mt-2">Browse the latest verified events on the ledger.</p>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border ${
                    selectedCategory === cat 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "bg-background/50 border-white/10 text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse">Fetching events from the ledger...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-12 text-center text-destructive">
              <p>Failed to load events. Please try again later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents?.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="group h-full"
                >
                  <EventCard event={event} className="h-full hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1" />
                </motion.div>
              ))}

              {filteredEvents?.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No events found</h3>
                  <p className="text-muted-foreground">Try adjusting your search terms or category</p>
                  <Button 
                    variant="link" 
                    onClick={() => { setSearch(""); setSelectedCategory("All"); }}
                    className="mt-2 text-primary"
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* =============================================
        NEWSLETTER SECTION
        =============================================
      */}
      <section className="container mx-auto px-4 md:px-6 py-20 mb-12">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-primary/10 via-emerald-500/5 to-purple-500/10 border border-white/10 p-8 md:p-12 lg:p-16 text-center">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary mb-2">
              <Mail className="w-6 h-6" />
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold">Stay in the loop</h2>
            <p className="text-muted-foreground text-lg">
              Get the latest updates on exclusive drops, artist announcements, and early bird tickets directly to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input 
                placeholder="Enter your email address" 
                className="bg-background/50 border-white/10 h-12 text-base"
              />
              <Button size="lg" className="h-12 px-8 font-semibold">Subscribe</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              By subscribing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
