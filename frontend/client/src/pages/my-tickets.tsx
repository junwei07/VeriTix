import { useEffect } from "react";
import { useLocation } from "wouter";

export default function MyTicketsPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/profile");
  }, [setLocation]);

  return null;
}
