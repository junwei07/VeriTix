import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";

export default function SignupPage() {
  const [, setLocation] = useLocation();
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
    } catch (e) {
      // ignore
    }

    // Navigate to payment page
    setLocation("/payment");
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-20">
      <Card className="w-full max-w-md p-8">
        <h2 className="text-2xl font-semibold mb-4">Create your account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm block mb-1">Username</label>
            <Input value={username} onChange={(e) => setUsername((e.target as HTMLInputElement).value)} />
          </div>
          <div>
            <label className="text-sm block mb-1">Password</label>
            <Input type="password" value={password} onChange={(e) => setPassword((e.target as HTMLInputElement).value)} />
          </div>
          {error && <div className="text-sm text-red-500">{error}</div>}

          <div className="flex flex-col gap-2">
            <Button type="submit" size="lg">Create account</Button>
            <Button type="button" variant="ghost" onClick={() => setLocation("/verified")}>Back</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
