import * as React from "react";
import { Link, useLocation } from "wouter";
import { Ticket, Home, User, LogIn, ShoppingBag, Calendar, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
    : "";

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/events", label: "Events", icon: Calendar },
    { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
    { href: "/profile", label: "Identity", icon: User },
  ];

  // Helper to determine if a link is active (handles nested routes)
  const isLinkActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  const [mockUser, setMockUser] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("mock_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        setMockUser(parsed.username || null);
      }
    } catch (e) {
      setMockUser(null);
    }
    const onChange = () => {
      try {
        const raw = localStorage.getItem("mock_user");
        if (raw) {
          const parsed = JSON.parse(raw);
          setMockUser(parsed.username || null);
        } else {
          setMockUser(null);
        }
      } catch (e) {
        setMockUser(null);
      }
    };

    window.addEventListener("mock_user_changed", onChange);
    // also listen to storage events from other tabs
    window.addEventListener("storage", onChange as any);
    return () => {
      window.removeEventListener("mock_user_changed", onChange);
      window.removeEventListener("storage", onChange as any);
    };
  }, []);

  const isLogged = isAuthenticated || !!mockUser;

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground selection:bg-primary/30">
      
      {/* =======================
          DESKTOP & MOBILE HEADER 
          ======================= */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/5 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          
          {/* 1. Logo */}
          <Link href="/" className="flex items-center gap-3 group relative z-10">
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-emerald-400 flex items-center justify-center text-black font-bold font-display text-xl shadow-[0_0_20px_rgba(34,197,94,0.4)] group-hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] transition-all duration-300">
              V
              <div className="absolute inset-0 bg-white/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight group-hover:text-primary transition-colors hidden sm:block">
              VeriTix
            </span>
          </Link>

          {/* 2. Desktop Navigation (Hidden on Mobile) */}
          <nav className="hidden md:flex items-center gap-1 relative z-0">
            {navItems.map((item) => {
              const isActive = isLinkActive(item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <div className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 cursor-pointer ${isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                    
                    {/* Sliding Background Animation */}
                    {isActive && (
                      <motion.div
                        layoutId="desktop-navbar-pill"
                        className="absolute inset-0 bg-primary rounded-full -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    
                    <span className="relative z-10 flex items-center gap-2">
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* 3. Right Side Actions (Auth) */}
          <div className="flex items-center gap-4">
            {isLogged ? (
              <Link href="/profile">
                <Button size="sm" className="gap-2 rounded-full font-semibold shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-shadow">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">View profile</span>
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button size="sm" className="gap-2 rounded-full font-semibold shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-shadow">
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign in</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* =======================
          MAIN CONTENT AREA
          ======================= */}
      <main className="flex-1 pt-16 pb-24 md:pb-12 container mx-auto px-4 md:px-6 relative z-0 max-w-7xl">
        {children}
      </main>

      {/* =======================
          DESKTOP FOOTER
          ======================= */}
      <footer className="hidden md:block border-t border-white/5 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-10 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-black font-bold font-display text-xl shadow-[0_0_15px_rgba(34,197,94,0.3)]">V</div>
                 <span className="font-display font-bold text-lg tracking-tight text-white">VeriTix</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                The next generation of event ticketing. Secure, transparent, and verified on the XRP Ledger. Stop scalping, start experiencing.
              </p>
                      {isLogged ? (
                         <Link href="/profile">
                           <Button size="sm" className="gap-2 rounded-full font-semibold shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-shadow">
                             <User className="w-4 h-4" />
                             <span className="hidden sm:inline">View profile</span>
                           </Button>
                         </Link>
                      ) : (
                        <Link href="/login">
                          <Button size="sm" className="gap-2 rounded-full font-semibold shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-shadow">
                            <LogIn className="w-4 h-4" />
                            <span className="hidden sm:inline">Singpass</span> Login
                          </Button>
                        </Link>
                      )}
            </div>
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2 text-xs text-muted-foreground">
                 <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                 Mainnet Beta
               </div>
            </div>
          </div>
        </div>
      </footer>

      {/* =======================
          MOBILE BOTTOM NAV (Pinned to Bottom)
          ======================= */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 h-16 bg-background/80 backdrop-blur-xl border border-white/10 rounded-2xl z-50 shadow-2xl flex justify-around items-center px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isLinkActive(item.href);
          
          return (
            <Link key={item.href} href={item.href}>
              <div className="relative flex flex-col items-center justify-center w-14 h-full group cursor-pointer">
                {/* Active Indicator Light */}
                {isActive && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full blur-[2px]" />
                )}

                <motion.div 
                  whileTap={{ scale: 0.8 }}
                  animate={isActive ? { y: -2 } : { y: 0 }}
                  className={`p-1.5 rounded-xl transition-colors ${isActive ? "text-primary bg-primary/10" : "text-muted-foreground group-hover:text-foreground"}`}
                >
                  <Icon className="w-5 h-5" />
                </motion.div>
                
                {/* Label (Only shows for active or on very small screens) */}
                <span className={`text-[10px] font-medium transition-all duration-300 ${isActive ? "text-foreground opacity-100 scale-100" : "text-muted-foreground opacity-0 scale-75 h-0 overflow-hidden"}`}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
