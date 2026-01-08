import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ShieldCheck, TicketCheck, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function BridgePage() {
  const [reference, setReference] = useState("");

  return (
    <div className="relative min-h-screen flex items-center justify-center py-16 px-4">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        <div className="rounded-3xl border border-white/10 bg-card/70 backdrop-blur-xl p-8 md:p-10 shadow-2xl">
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <Badge className="bg-emerald-500/10 text-emerald-200 border border-emerald-500/30">
              Partner Redirect
            </Badge>
            <Badge variant="outline" className="border-white/10 text-white/70">
              Singpass Verified
            </Badge>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-display font-bold">
              Verify & Secure Your Ticket
            </h1>
            <p className="text-muted-foreground">
              You’re in the right place. Confirm your purchase and we’ll secure
              your ticket with identity verification—no crypto required.
            </p>
          </div>

          <div className="mt-8 grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex items-center gap-3 text-sm text-white/80">
                <TicketCheck className="h-4 w-4 text-emerald-200" />
                Enter your order ID or paste your ticket link (optional)
              </div>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Order ID / Ticket URL"
                className="mt-3 bg-black/40 border-white/10 h-12"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/login?next=/profile" className="w-full">
                <Button size="lg" className="w-full gap-2">
                  Continue with Singpass
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/" className="w-full">
                <Button size="lg" variant="outline" className="w-full">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-8 grid md:grid-cols-2 gap-4 text-sm text-white/80">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-4 w-4 text-emerald-200" />
                Verified Identity
              </div>
              <p className="mt-2 text-muted-foreground">
                Tickets are tied to real identities to stop scalping and bots.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex items-center gap-2 font-semibold">
                <TicketCheck className="h-4 w-4 text-emerald-200" />
                Secure Access
              </div>
              <p className="mt-2 text-muted-foreground">
                Your ticket is secured on XRPL behind the scenes.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
