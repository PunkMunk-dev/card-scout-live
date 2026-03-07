import { lazy, Suspense } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageSkeleton } from "@/components/PageSkeleton";
import { WatchlistProvider } from "@/contexts/WatchlistContext";
import Index from "./pages/Index";

const TcgLab = lazy(() => import("./pages/TcgLab"));
const SportsLab = lazy(() => import("./pages/SportsLab"));
const TopRoi = lazy(() => import("./pages/TopRoi"));
const UIAudit = lazy(() => import("./pages/UIAudit"));
const Diagnostics = lazy(() => import("./pages/Diagnostics"));
const LogoShowcase = lazy(() => import("./pages/LogoShowcase"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" storageKey="omni-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WatchlistProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppShell>
              <Suspense fallback={<PageSkeleton />}>
                <Routes>
                  <Route path="/" element={<ErrorBoundary><Index /></ErrorBoundary>} />
                  <Route path="/tcg" element={<ErrorBoundary><TcgLab /></ErrorBoundary>} />
                  <Route path="/sports" element={<ErrorBoundary><SportsLab /></ErrorBoundary>} />
                  <Route path="/roi" element={<ErrorBoundary><TopRoi /></ErrorBoundary>} />
                  <Route path="/ui-audit" element={<UIAudit />} />
                  <Route path="/diagnostics" element={<ErrorBoundary><Diagnostics /></ErrorBoundary>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AppShell>
          </BrowserRouter>
        </WatchlistProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
