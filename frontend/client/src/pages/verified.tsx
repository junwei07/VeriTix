import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { sanitizeNextPath } from "@/lib/auth-utils";

export default function VerifiedPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  // Read next param from URL to handle redirects properly
  const params = new URLSearchParams(window.location.search);
  const next = sanitizeNextPath(params.get("next"));

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      setLocation(next || "/");
    }
  }, [isAuthenticated, isLoading, next, setLocation]);

  const handleContinue = () => {
    // If there is a 'next' param, pass it along to the signup page
    if (next) {
      setLocation(`/signup?next=${encodeURIComponent(next)}`);
    } else {
      setLocation("/signup");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      
      {/* Background Ambience (Consistent with Home) */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="w-full max-w-md"
      >
        <Card className="relative overflow-hidden border-white/10 bg-black/40 backdrop-blur-xl p-8 md:p-12 shadow-2xl">
          
          {/* Decorative Top Glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-primary to-emerald-500 opacity-50" />
          
          <div className="flex flex-col items-center text-center space-y-8">
            
            {/* Animated Success Icon */}
            <div className="relative">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500/20 to-primary/20 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]"
              >
                <ShieldCheck className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
              </motion.div>
            
            </div>

            {/* Text Content */}
            <div className="space-y-2">
              <h2 className="text-3xl font-display font-bold text-white tracking-tight">
                Identity Verified
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Your Singpass data has been successfully cryptographically proved. You are ready to mint your identity on VeriTix.
              </p>
            </div>

            {/* Actions */}
            <div className="w-full space-y-3 pt-4">
              <Button 
                size="lg" 
                className="w-full h-12 text-base gap-2 rounded-xl font-semibold shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all" 
                onClick={handleContinue}
              >
                Create Digital Wallet <ArrowRight className="w-4 h-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-muted-foreground hover:text-white" 
                onClick={() => setLocation(next || "/")}
              >
                Return to Home
              </Button>
            </div>

            {/* Trust Indicator */}
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest pt-4 border-t border-white/5 w-full justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Secured by Singpass & XRPL
            </div>

          </div>
        </Card>
      </motion.div>
    </div>
  );
}
