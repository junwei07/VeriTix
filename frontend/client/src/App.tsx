import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import LoginPage from "@/pages/login";
import EventDetailPage from "@/pages/event-detail";
import MyTicketsPage from "@/pages/my-tickets";
import TicketViewPage from "@/pages/ticket-view";
import ProfilePage from "@/pages/profile";
import MarketplacePage from "@/pages/marketplace";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/marketplace" component={MarketplacePage} />
        <Route path="/events/:id" component={EventDetailPage} />
        <Route path="/my-tickets" component={MyTicketsPage} />
        <Route path="/tickets/:id" component={TicketViewPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
