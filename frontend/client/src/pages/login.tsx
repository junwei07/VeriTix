import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShieldCheck, ArrowRight, UserCheck } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const handleLogin = () => {
    // Read `next` from current URL and forward it to /verified
    let next: string | null = null;
    try {
      const params = new URLSearchParams(window.location.search);
      next = params.get("next");
    } catch (e) {}

    const target = next ? `/verified?next=${encodeURIComponent(next)}` : "/verified";
    setLocation(target);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center py-20">
      {/* Full Background Gradients */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[100px]" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-blue-500/5 blur-[80px]" />
        <div className="absolute bottom-[30%] left-[20%] w-[400px] h-[400px] rounded-full bg-purple-500/8 blur-[90px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md px-4"
      >
        <Card className="w-full bg-card/60 backdrop-blur-xl border-white/10 p-8 md:p-10 relative overflow-hidden shadow-2xl">
          {/* Animated gradient border top */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
          
          {/* Decorative corner elements */}
          <div className="absolute top-4 right-4 w-20 h-20 bg-primary/5 rounded-full blur-2xl" />
          <div className="absolute bottom-4 left-4 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl" />

          <div className="flex flex-col items-center text-center space-y-8 relative z-10">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, delay: 0.2, type: "spring" }}
              className="w-24 h-24 rounded-2xl bg-gradient-to-br from-zinc-900 to-black border border-primary/30 flex items-center justify-center shadow-2xl shadow-primary/20"
            >
              <ShieldCheck className="w-12 h-12 text-primary drop-shadow-[0_0_20px_rgba(34,197,94,0.5)]" />
            </motion.div>

            {/* Heading */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-3"
            >
              <h1 className="text-4xl md:text-5xl font-display font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                Welcome to VeriTix
              </h1>
              <p className="text-muted-foreground text-base leading-relaxed max-w-sm">
                Secure, blockchain-backed ticketing platform verified by Singpass.
              </p>
            </motion.div>

            {/* Login Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="grid gap-4 w-full pt-2"
            >
              <Button
                size="lg"
                onClick={handleLogin}
                className="w-full relative overflow-hidden group bg-[#ce1126] hover:bg-[#a50e1e] text-white shadow-lg shadow-red-900/30 hover:shadow-red-900/50 transition-all duration-300 h-14 text-base font-semibold"
              >
                <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Singapore_Singpass_Logo.svg/2560px-Singapore_Singpass_Logo.svg.png')] opacity-10 bg-center bg-no-repeat bg-contain" />
                <span className="relative flex items-center justify-center gap-3">
                  <UserCheck className="w-5 h-5" />
                  Log in with Singpass
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </span>
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60 font-mono pt-2">
                <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                <span>Powered by XRPL</span>
                <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
              </div>
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
