import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function VerifiedPage() {
  const [, setLocation] = useLocation();

  // read next param from URL
  let next: string | null = null;
  try {
    const params = new URLSearchParams(window.location.search);
    next = params.get("next");
  } catch (e) {}

  return (
    <div className="min-h-screen flex items-center justify-center py-20">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-semibold">You are verified</h2>
          <p className="text-sm text-muted-foreground">Singpass verification successful (mock).</p>

          <div className="w-full">
            <Button size="lg" className="w-full mt-2" onClick={() => setLocation(next ? `/signup?next=${encodeURIComponent(next)}` : "/signup")}>
              Create account
            </Button>
            <Button size="sm" variant="ghost" className="w-full mt-2" onClick={() => setLocation(next ? decodeURIComponent(next) : "/")}>
              Back to home
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
