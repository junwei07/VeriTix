import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import CreateWalletCard from "@/components/ui/create-wallet";

export default function CreateWalletPage() {
  const [, setLocation] = useLocation();
  // read next param
  let next: string | null = null;
  try {
    const params = new URLSearchParams(window.location.search);
    next = params.get("next");
  } catch (e) {}
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Please enter a username and password.");
      return;
    }

    // Mock account creation: store in localStorage (for demo only)
    try {
      localStorage.setItem("mock_user", JSON.stringify({ username }));
      // Notify other parts of the app that mock_user changed (same-window)
      try {
        window.dispatchEvent(new CustomEvent("mock_user_changed"));
      } catch (e) {}
    } catch (e) {
      // ignore
    }

    // Navigate to the next target if provided, otherwise go home (signup-only)
    if (next) {
      setLocation(decodeURIComponent(next));
    } else {
      // setLocation("/");
      setLocation("/create-wallet");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-20">
      <CreateWalletCard />
    </div>
  );
}
