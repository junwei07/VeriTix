import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function PaymentPage() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("mock_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed.username || null);
      }
    } catch (e) {}
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center py-20">
      <Card className="w-full max-w-md p-8 text-center">
        <h2 className="text-2xl font-semibold">Payment</h2>
        <p className="text-sm text-muted-foreground mt-2">Hello {user ?? "guest"}, this is a mock payment page.</p>

        <div className="mt-6 grid gap-3">
          <Button onClick={() => alert("Mock payment processed")}>Pay now</Button>
          <Button variant="ghost" onClick={() => setLocation("/")}>Back to home</Button>
        </div>
      </Card>
    </div>
  );
}
