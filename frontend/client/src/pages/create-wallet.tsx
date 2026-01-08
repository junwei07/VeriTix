import { useEffect } from "react";
import { useLocation } from "wouter";

export default function CreateWalletPage() {
  const [, setLocation] = useLocation();
  
  // Redirect to signup page (which handles NRIC and wallet creation)
  useEffect(() => {
    let next: string | null = null;
    try {
      const params = new URLSearchParams(window.location.search);
      next = params.get("next");
    } catch (e) {}
    
    const target = next ? `/signup?next=${encodeURIComponent(next)}` : "/signup";
    setLocation(target);
  }, [setLocation]);

  return null; // Will redirect immediately
}
