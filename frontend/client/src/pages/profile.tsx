import { useAuth } from "@/hooks/use-auth";
import { Loader2, Copy, Wallet, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const { user, isLoading, logout } = useAuth();
  const { toast } = useToast();
  const [mockUser, setMockUser] = useState<any | null>(null);
  const [nfts, setNfts] = useState<any[]>([]);
  const [tab, setTab] = useState<"details" | "nfts">("details");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("mock_user");
      if (raw) setMockUser(JSON.parse(raw));
      else setMockUser(null);
    } catch (e) {
      setMockUser(null);
    }

    const loadNfts = () => {
      try {
        const arrRaw = localStorage.getItem("mock_user_nfts");
        const arr = arrRaw ? JSON.parse(arrRaw) : [];
        const owner =
          (user && (user.email || `${user.firstName || ""} ${user.lastName || ""}`.trim())) ||
          (mockUser && (mockUser.username || mockUser.email));
        if (owner) {
          setNfts(arr.filter((x: any) => x.owner === owner));
        } else {
          setNfts([]);
        }
      } catch (e) {
        setNfts([]);
      }
    };

    loadNfts();

    const onChange = () => loadNfts();
    window.addEventListener("mock_user_nfts_changed", onChange);
    window.addEventListener("storage", onChange as any);
    return () => {
      window.removeEventListener("mock_user_nfts_changed", onChange);
      window.removeEventListener("storage", onChange as any);
    };
  }, [user, mockUser]);

  if (isLoading) return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  const effectiveUser = user || mockUser;

  if (!effectiveUser) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <Link href="/login"><Button>Login</Button></Link>
      </div>
    );
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Address copied to clipboard" });
  };

  const displayName = user ? [user.firstName, user.lastName].filter(Boolean).join(" ").trim() : (mockUser?.username || mockUser?.email || "Anonymous");
  const initials = displayName
    ? displayName.charAt(0).toUpperCase()
    : (effectiveUser.email ? effectiveUser.email.charAt(0).toUpperCase() : "A");

  return (
    <div className="relative min-h-screen pb-20 max-w-2xl mx-auto space-y-8">
      {/* Fixed Background Gradients */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-emerald-500/10 blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-primary/10 blur-[100px]" />
      </div>
      <h1 className="text-4xl font-display font-bold">Identity Profile</h1>

      {/* User Info Card */}
      <div className="bg-card border border-white/10 rounded-3xl p-8 space-y-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-primary/20 flex items-center justify-center text-4xl font-display font-bold text-primary shadow-[0_0_20px_rgba(34,197,94,0.2)]">
            {initials}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{displayName || effectiveUser.email || "Anonymous"}</h2>
            <p className="text-muted-foreground">{effectiveUser.email || effectiveUser.username || "No email linked"}</p>
            <div className="flex items-center gap-2 mt-2 bg-emerald-500/10 px-3 py-1 rounded-full w-fit">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-emerald-400">Singpass Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Info */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold font-display flex items-center gap-2">
          <Wallet className="w-5 h-5" /> XRPL Wallet
        </h3>

        <div className="bg-black/50 border border-white/10 rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Wallet Address</label>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-sm font-mono text-primary bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/20 flex-1 truncate">
                {effectiveUser.walletAddress || "Generating wallet..."}
              </code>
              <Button size="icon" variant="ghost" onClick={() => effectiveUser.walletAddress && copyToClipboard(effectiveUser.walletAddress)}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-card p-4 rounded-xl border border-white/5">
              <span className="text-xs text-muted-foreground">Network</span>
              <p className="font-bold">Testnet</p>
            </div>
            <div className="bg-card p-4 rounded-xl border border-white/5">
              <span className="text-xs text-muted-foreground">Balance</span>
              <p className="font-bold">1,000 XRP</p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-between items-center">
        <div className="flex gap-2">
          <Button variant={tab === "details" ? "default" : "ghost"} onClick={() => setTab("details")}>Details</Button>
          <Button variant={tab === "nfts" ? "default" : "ghost"} onClick={() => setTab("nfts")}>See my NFTs</Button>
        </div>
        <div>
          {user ? (
            <Button variant="destructive" onClick={() => logout()}>
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          ) : (
            <Button variant="destructive" onClick={() => {
              localStorage.removeItem("mock_user");
              window.dispatchEvent(new Event("mock_user_changed"));
              // navigate to home
              window.location.href = "/";
            }}>
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          )}
        </div>
      </div>

      {tab === "nfts" && (
        <div className="mt-6 space-y-4">
          {nfts.length === 0 ? (
            <div className="text-center text-muted-foreground">You haven't purchased any NFTs yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {nfts.map((n) => (
                <div key={n.id} className="border rounded-lg p-4 bg-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold">{n.description}</div>
                      <div className="text-xs text-muted-foreground">Order {n.orderId} • {new Date(n.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="text-sm font-mono">{(n.amountCents/100).toFixed(2)} SGD</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
