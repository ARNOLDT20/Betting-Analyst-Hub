import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { ErrorBoundary } from "@/components/error-boundary";
import Dashboard from "@/pages/dashboard";
import MatchesPage from "@/pages/matches";
import MatchDetailPage from "@/pages/match-detail";
import HotPage from "@/pages/hot";
import BetOfTheDayPage from "@/pages/bet-of-the-day";
import BetBuilderPage from "@/pages/bet-builder";
import PredictionsPage from "@/pages/predictions";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Layout>
      <ErrorBoundary>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/matches" component={MatchesPage} />
          <Route path="/matches/:id" component={MatchDetailPage} />
          <Route path="/hot" component={HotPage} />
          <Route path="/bet-of-the-day" component={BetOfTheDayPage} />
          <Route path="/bet-builder" component={BetBuilderPage} />
          <Route path="/predictions" component={PredictionsPage} />
          <Route component={NotFound} />
        </Switch>
      </ErrorBoundary>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
