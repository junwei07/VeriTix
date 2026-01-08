import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { sanitizeNextPath } from "@/lib/auth-utils";

export default function CreateWalletPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  
  // Redirect to signup page (which handles NRIC and wallet creation)
  useEffect(() => {
    if (isLoading) return;
    const params = new URLSearchParams(window.location.search);
    const next = sanitizeNextPath(params.get("next"));
    if (isAuthenticated) {
      setLocation(next || "/");
      return;
    }
    
    const target = next ? `/signup?next=${encodeURIComponent(next)}` : "/signup";
    setLocation(target);
  }, [isAuthenticated, isLoading, setLocation]);

  return null; // Will redirect immediately
}
