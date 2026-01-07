import { Link, useLocation } from "wouter";
import { Ticket, Home, User, LogIn, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Events", icon: Home },
    { href: "/my-tickets", label: "My Wallet", icon: Ticket },
    { href: "/profile", label: "Identity", icon: User },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground overflow-x-hidden">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 glass h-16">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-black font-bold font-display text-xl shadow-[0_0_15px_rgba(34,197,94,0.5)] group-hover:scale-110 transition-transform">
              V
            </div>
            <span className="font-display font-bold text-xl tracking-tight group-hover:text-primary transition-colors">
              VeriTix
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`
                      px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200 cursor-pointer
                      ${isActive 
                        ? "bg-primary/10 text-primary shadow-[0_0_10px_rgba(34,197,94,0.1)] border border-primary/20" 
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"}
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Auth Button */}
          <div className="hidden md:flex items-center">
            {isAuthenticated ? (
               <div className="flex items-center gap-3 bg-card border border-white/10 px-3 py-1.5 rounded-full">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-xs font-mono text-muted-foreground truncate max-w-[100px]">
                   {user?.displayName || user?.username}
                 </span>
               </div>
            ) : (
              <Link href="/login">
                <Button size="sm" variant="neon" className="gap-2">
                  <LogIn className="w-4 h-4" />
                  Singpass Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 top-16 z-40 bg-background/95 backdrop-blur-xl p-4 md:hidden flex flex-col gap-4 border-t border-white/5"
          >
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <div 
                  className="p-4 rounded-xl bg-card border border-white/5 flex items-center gap-3 text-lg font-medium active:scale-95 transition-transform"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5 text-primary" />
                  {item.label}
                </div>
              </Link>
            ))}
            {!isAuthenticated && (
              <Link href="/login">
                <Button className="w-full mt-4" size="lg" onClick={() => setMobileMenuOpen(false)}>
                  Login with Singpass
                </Button>
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 pt-24 pb-20 container mx-auto px-4 relative z-0">
        {children}
      </main>

      {/* Mobile Bottom Bar (Alternative to top drawer for quick access) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-xl border-t border-white/5 z-50 flex justify-around items-center px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex flex-col items-center justify-center w-16 h-full gap-1 ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                <motion.div whileTap={{ scale: 0.8 }}>
                  <Icon className={`w-6 h-6 ${isActive && "drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]"}`} />
                </motion.div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
