import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShieldCheck, ArrowRight, UserCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const handleLogin = () => {
    // Redirect to the Replit auth endpoint
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl animate-pulse" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md bg-card/80 backdrop-blur-xl border-white/10 p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
          
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center shadow-2xl">
              <ShieldCheck className="w-10 h-10 text-primary" />
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-display font-bold">Welcome to VeriTix</h1>
              <p className="text-muted-foreground">
                Secure, blockchain-backed ticketing platform verified by Singpass.
              </p>
            </div>

            <div className="grid gap-4 w-full pt-4">
              <Button 
                size="lg" 
                onClick={handleLogin}
                className="w-full relative overflow-hidden group bg-[#ce1126] hover:bg-[#a50e1e] text-white shadow-lg shadow-red-900/20"
              >
                <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Singapore_Singpass_Logo.svg/2560px-Singapore_Singpass_Logo.svg.png')] opacity-10 bg-center bg-no-repeat bg-contain" />
                <span className="relative flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Log in with Singpass
                </span>
                <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </Button>
              
              <div className="text-xs text-center text-muted-foreground/50 font-mono">
                Powered by XRPL & Replit Auth
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
