import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import { loginWithNRIC } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // read next param
  let next: string | null = null;
  try {
    const params = new URLSearchParams(window.location.search);
    next = params.get("next");
  } catch (e) {}
  
  const [nric, setNric] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "authenticating" | "creating-account">("idle");

  // Check if user already exists in localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("veritix_user");
      if (stored) {
        const user = JSON.parse(stored);
        // If user exists, redirect them
        if (next) {
          setLocation(decodeURIComponent(next));
        } else {
          setLocation("/");
        }
      }
    } catch (e) {
      // Ignore
    }
  }, [next, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStatus("idle");
    
    if (!nric.trim()) {
      setError("Please enter your NRIC.");
      return;
    }

    // Basic NRIC format validation (S/T followed by 7 digits and a letter)
    const nricPattern = /^[STFG]\d{7}[A-Z]$/i;
    if (!nricPattern.test(nric.trim())) {
      setError("Please enter a valid NRIC format (e.g., S1234567A)");
      return;
    }

    setIsLoading(true);
    setStatus("authenticating");

    try {
      // Call backend to create/retrieve account
      setStatus("creating-account");
      const userData = await loginWithNRIC(nric.trim().toUpperCase());
      
      // Store user data in localStorage (demo only - in production use secure session)
      const userToStore = {
        nric: userData.nric,
        walletAddress: userData.walletAddress,
        // Note: In production, never store seed in localStorage!
        // Only store if backend returns it (demo mode)
        ...(userData.seed && { seed: userData.seed }),
      };
      
      localStorage.setItem("veritix_user", JSON.stringify(userToStore));
      
      // Notify other parts of the app
      window.dispatchEvent(new CustomEvent("veritix_user_changed"));

      toast({
        title: "Account Created Successfully!",
        description: `Your VeriTix account is ready.`,
      });

      // Navigate to the next target if provided, otherwise go home
      if (next) {
        setLocation(decodeURIComponent(next));
      } else {
        setLocation("/verified");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to create account. Please try again.";
      setError(errorMessage);
      setStatus("idle");
      toast({
        title: "Authentication Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center py-20">
      {/* Background Gradients */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md px-4"
      >
        <Card className="w-full bg-card/60 backdrop-blur-xl border-white/10 p-8 md:p-10 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
          
          <div className="flex flex-col items-center text-center space-y-6 relative z-10">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, delay: 0.2, type: "spring" }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-900 to-black border border-primary/30 flex items-center justify-center shadow-2xl shadow-primary/20"
            >
              <ShieldCheck className="w-10 h-10 text-primary" />
            </motion.div>

            <div className="space-y-2">
              <h2 className="text-3xl font-display font-bold">Create Account</h2>
              <p className="text-muted-foreground text-sm">
                Enter your NRIC to create your VeriTix account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium block text-left">NRIC</label>
                <Input
                  type="text"
                  placeholder="S1234567A"
                  value={nric}
                  onChange={(e) => {
                    setNric(e.target.value);
                    setError("");
                  }}
                  className="h-12 text-base bg-background/50 border-white/10"
                  disabled={isLoading}
                  maxLength={9}
                />
                <p className="text-xs text-muted-foreground text-left">
                  Format: S/T followed by 7 digits and a letter
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </motion.div>
              )}

              {status === "authenticating" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-sm text-primary bg-primary/10 p-3 rounded-lg"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Identity...</span>
                </motion.div>
              )}

              {status === "creating-account" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-sm text-primary bg-primary/10 p-3 rounded-lg"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating your account...</span>
                </motion.div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isLoading}
                  className="w-full h-12 text-base font-semibold"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {status === "authenticating" ? "Verifying..." : "Creating Account..."}
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setLocation("/verified")}
                  disabled={isLoading}
                >
                  Back
                </Button>
              </div>
            </form>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60 font-mono pt-2">
              <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
              <span>Secured by XRPL</span>
              <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
