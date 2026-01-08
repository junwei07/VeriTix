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
    const [listingInProgress, setListingInProgress] = useState(false);
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
        const legacyRaw = localStorage.getItem("mock_user_nfts");
        const legacy = legacyRaw ? JSON.parse(legacyRaw) : [];
        const ticketRaw = localStorage.getItem("veritix_tickets");
        const tickets = ticketRaw ? JSON.parse(ticketRaw) : [];

        const owner =
          (user && user.walletAddress) ||
          (mockUser && (mockUser.username || mockUser.email));

        const ownedTickets = owner
          ? tickets.filter((x: any) => x.walletAddress === owner)
          : [];

        const legacyOwned = owner
          ? legacy.filter((x: any) => x.owner === owner)
          : [];

        setNfts([...ownedTickets, ...legacyOwned]);
      } catch (e) {
        setNfts([]);
      }
    };

    loadNfts();

    const onChange = () => loadNfts();
    window.addEventListener("mock_user_nfts_changed", onChange);
    window.addEventListener("veritix_tickets_changed", onChange);
    window.addEventListener("storage", onChange as any);
    return () => {
      window.removeEventListener("mock_user_nfts_changed", onChange);
      window.removeEventListener("veritix_tickets_changed", onChange);
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

  const displayName = user ? user.nric : (mockUser?.username || mockUser?.email || "Anonymous");
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
            <h2 className="text-2xl font-bold">{displayName || "Anonymous"}</h2>
            <p className="text-muted-foreground">{user?.walletAddress || effectiveUser.email || effectiveUser.username || "No wallet linked"}</p>
            <div className="flex items-center gap-2 mt-2 bg-emerald-500/10 px-3 py-1 rounded-full w-fit">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-emerald-400">Singpass Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* (Wallet removed per request) */}

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
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        try {
                          // Determine sale price from NFT data (in cents)
                          const nftPriceCents = n.amountCents ?? n.purchasePrice ?? (n.price ? Math.round(n.price) : undefined);
                          if (!nftPriceCents || nftPriceCents <= 0) {
                            toast({ title: 'Cannot list', description: 'This NFT has no valid price to list', variant: 'destructive' });
                            return;
                          }

                          // Confirmation popup
                          const confirmMsg = `List "${n.description || 'NFT'}" for ${(nftPriceCents / 100).toFixed(2)} SGD on the marketplace?`;
                          if (!window.confirm(confirmMsg)) return;

                          setListingInProgress(true);

                          // Load existing listings from localStorage
                          const raw = localStorage.getItem('mock_listings');
                          const existing = raw ? JSON.parse(raw) : [];
                          const nextId = (existing.length > 0 ? Math.max(...existing.map((x: any) => x.id)) : 1000) + 1;
                          const sellerName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : (mockUser?.username || mockUser?.email || 'Anonymous');

                          // Ensure event image and fields are copied into the listing
                          const ticketWithEvent = {
                            ...n,
                            id: nextId + 100,
                            seat: n.seat || n.ticket?.seat || n.seat || undefined,
                            event: n.event || {
                              id: n.eventId || 0,
                              title: n.description || 'NFT',
                              description: n.description || '',
                              location: n.location || 'Unknown',
                              date: n.date || new Date().toISOString(),
                              price: n.price || 0,
                              imageUrl: n.imageUrl || n.image?.url || (n.event && n.event.imageUrl) || '',
                              availableTickets: n.availableTickets || 0,
                              totalTickets: n.totalTickets || 0,
                              createdAt: n.createdAt || new Date().toISOString(),
                            }
                          };

                          const listing = {
                            id: nextId,
                            ticket: ticketWithEvent,
                            price: nftPriceCents,
                            sellerName,
                          };

                          existing.push(listing);
                          localStorage.setItem('mock_listings', JSON.stringify(existing));

                          // Remove NFT from user's owned list
                          const nftRaw = localStorage.getItem('mock_user_nfts');
                          const nftArr = nftRaw ? JSON.parse(nftRaw) : [];
                          const newArr = nftArr.filter((x: any) => x.id !== n.id);
                          localStorage.setItem('mock_user_nfts', JSON.stringify(newArr));

                          // Trigger update events and UI
                          window.dispatchEvent(new Event('mock_listings_changed'));
                          window.dispatchEvent(new Event('mock_user_nfts_changed'));
                          toast({ title: 'Listing created', description: 'Your NFT is now listed on the marketplace' });
                        } catch (e) {
                          toast({ title: 'Listing failed', description: 'Could not list NFT', variant: 'destructive' });
                        } finally {
                          setListingInProgress(false);
                        }
                      }}
                      disabled={listingInProgress}
                    >
                      Sell
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { window.location.href = '/marketplace'; }}>
                      View Marketplace
                    </Button>
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
