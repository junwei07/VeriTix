import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import LoginPage from "@/pages/login";
import VerifiedPage from "@/pages/verified";
import SignupPage from "@/pages/signup";
import PaymentPage from "@/pages/payment";
import EventDetailPage from "@/pages/event-detail";
import MyTicketsPage from "@/pages/my-tickets";
import TicketViewPage from "@/pages/ticket-view";
import ProfilePage from "@/pages/profile";
import MarketplacePage from "@/pages/marketplace";
import EventsPage from "@/pages/events";
import CreateWalletPage from "@/pages/create-wallet";
import BridgePage from "@/pages/bridge";
import NewNftPage from "./pages/new-nft";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/login" component={LoginPage} />
          <Route path="/verified" component={VerifiedPage} />
          <Route path="/signup" component={SignupPage} />
          <Route path="/create-wallet" component={CreateWalletPage} />
          <Route path="/new-nft" component={NewNftPage} />
          <Route path="/payment" component={PaymentPage} />
        <Route path="/events" component={EventsPage} />
        <Route path="/marketplace" component={MarketplacePage} />
        <Route path="/events/:id" component={EventDetailPage} />
        <Route path="/my-tickets" component={MyTicketsPage} />
        <Route path="/tickets/:id" component={TicketViewPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/bridge" component={BridgePage} />
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
