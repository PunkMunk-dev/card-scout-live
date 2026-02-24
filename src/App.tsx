import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TabNavigation } from "@/components/TabNavigation";
import { SportsWatchlistProvider } from "@/contexts/SportsWatchlistContext";
import Index from "./pages/Index";
import TcgLab from "./pages/TcgLab";
import SportsLab from "./pages/SportsLab";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SportsWatchlistProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <TabNavigation />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/tcg" element={<TcgLab />} />
            <Route path="/sports" element={<SportsLab />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SportsWatchlistProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
