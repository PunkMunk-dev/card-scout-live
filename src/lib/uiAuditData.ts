// Static architecture data for UI Audit report
// Hardcoded since we can't read files at runtime in a bundled SPA

export interface AuditSection {
  id: string;
  title: string;
  detectedComponents: string[];
  codeExcerpts: { label: string; code: string }[];
  notes: string[];
}

export function getAuditSections(): AuditSection[] {
  return [sectionA(), sectionB(), sectionC(), sectionD(), sectionE()];
}

function sectionA(): AuditSection {
  return {
    id: 'routing-shell',
    title: 'A) Routing + Shell',
    detectedComponents: [
      'src/App.tsx — Root component, defines <BrowserRouter> + <Routes>',
      'src/components/TabNavigation.tsx — Responsive nav: desktop sticky header + mobile bottom tab bar',
      'src/components/ErrorBoundary.tsx — Per-route error boundary wrapper',
      'src/components/PageSkeleton.tsx — Suspense fallback skeleton',
    ],
    codeExcerpts: [
      {
        label: 'App.tsx — Route definitions',
        code: `const TcgLab = lazy(() => import("./pages/TcgLab"));
const SportsLab = lazy(() => import("./pages/SportsLab"));
const TopRoi = lazy(() => import("./pages/TopRoi"));

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" storageKey="omni-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WatchlistProvider>
          <Toaster /> <Sonner />
          <BrowserRouter>
            <TabNavigation />
            <Suspense fallback={<PageSkeleton />}>
              <Routes>
                <Route path="/" element={<ErrorBoundary><Index /></ErrorBoundary>} />
                <Route path="/tcg" element={<ErrorBoundary><TcgLab /></ErrorBoundary>} />
                <Route path="/sports" element={<ErrorBoundary><SportsLab /></ErrorBoundary>} />
                <Route path="/roi" element={<ErrorBoundary><TopRoi /></ErrorBoundary>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </WatchlistProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);`,
      },
      {
        label: 'TabNavigation.tsx — Nav structure (outline)',
        code: `// Desktop: sticky <header> with OmniLogo, search form, theme toggle, WatchlistDropdown
// Mobile: fixed bottom <nav> with tab links (TCG, Sports, ROI), Search link, theme toggle
// tabs = [{ to: "/tcg", label: "TCG Market" }, { to: "/sports", label: "Sports" }, { to: "/roi", label: "Top ROI" }]
// Search navigates to /?q=...
// Theme toggle via next-themes useTheme()`,
      },
    ],
    notes: [
      'All routes are lazy-loaded with React.lazy + Suspense.',
      'No persistent layout wrapper beyond TabNavigation — each page manages its own layout.',
      'State resets completely on route change (no cross-page state persistence except WatchlistContext).',
    ],
  };
}

function sectionB(): AuditSection {
  return {
    id: 'app-entry-pages',
    title: 'B) Three App Entry Pages',
    detectedComponents: [
      'src/pages/Index.tsx — Universal search (eBay) + landing hero',
      'src/pages/TcgLab.tsx — TCG Market (Pokémon/One Piece card search)',
      'src/pages/SportsLab.tsx — Sports Market (player/brand/trait search)',
      'src/pages/TopRoi.tsx — ROI analysis grid',
    ],
    codeExcerpts: [
      {
        label: 'Index.tsx — State + structure',
        code: `// State: query, items[], total, nextPage, isLoading, isLoadingMore, hasSearched, sort, error, fromWatchlist
// If !hasSearched → renders hero CTA + market tiles (links to /tcg, /sports)
// If hasSearched → SearchFilters toolbar + ListingGrid + LoadMore
// Search: searchEbay({ query, page, limit:48, sort, buyingOptions }) via useCallback
// Watchlist: useSharedWatchlist() from WatchlistContext`,
      },
      {
        label: 'TcgLab.tsx — State + structure',
        code: `// State: selectedGame, selectedTarget, selectedSetId, setSelectorOpen, totalCount, isSearchLoading, mode('guided'|'quick'), quickQuery
// useSets(selectedGame) — fetches sets from Supabase
// Header: TcgHeader with game/target/set dropdowns + SearchModeToggle + QuickSearchInput
// Body: mode==='quick' → TerminalView(freeQuery) | mode==='guided' → TerminalView(target,game,set) | else → GuidedSearchEmptyState
// TerminalView handles search via useInfiniteQuery → searchActiveListings → supabase.functions.invoke('tcg-ebay-search')`,
      },
      {
        label: 'SportsLab.tsx — State + structure',
        code: `// State: resultCount, isSearching, watchlistOpen, showScrollTop, searchMode('guided'|'quick'), quickSearchQuery
// useSportsRulesetSnapshot() — loads snapshot with sports, players, rule_items
// useSportsQueryBuilderState(rule_items) — manages sport_key, selected_player_ids, selected_rule_item_ids, show_all_brands
// Guided: ResultsGrid(playerNames, brandLabel, traitLabels, sportKey)
// Quick: EbayResultsPanel(searchParams={playerName, freeFormSearch:true}, sportKey)
// Both call useSportsEbaySearch → supabase.functions.invoke('sports-ebay-search')`,
      },
      {
        label: 'TopRoi.tsx — State + structure',
        code: `// State: sortKey, searchQuery, visibleCount (pagination), PAGE_SIZE=40
// useRoiCards('All') — fetches roi_cards from Supabase table
// usePrefetchRoiEbayListings(cards, 10) — background prefetch top 10
// Sort: SORT_OPTIONS [{field:'psa10_profit',dir},{field:'raw_avg',dir},{field:'multiplier',dir}]
// Filter: searchQuery filters by card_name.includes(q)
// Grid: RoiCard components + "Load more" button`,
      },
    ],
    notes: [
      'Each page fully owns its state — no shared state between apps except WatchlistContext.',
      'TcgLab and SportsLab both support "guided" and "quick" search modes with a toggle.',
      'Index page doubles as landing page (hero) and search results page.',
    ],
  };
}

function sectionC(): AuditSection {
  return {
    id: 'global-state',
    title: 'C) Global State + Data Plumbing',
    detectedComponents: [
      'next-themes ThemeProvider — dark/light mode (storageKey: "omni-theme")',
      '@tanstack/react-query QueryClientProvider — data fetching cache',
      'src/contexts/WatchlistContext.tsx — WatchlistProvider (shared eBay watchlist)',
      'src/contexts/SportsWatchlistContext.tsx — Sports-specific watchlist',
      '@radix-ui/react-tooltip TooltipProvider',
    ],
    codeExcerpts: [
      {
        label: 'Shared hooks (names + purposes)',
        code: `// src/hooks/useTcgData.ts — useSets(game), useTargets(game), useTcgWatchlist hooks
// src/hooks/useSportsEbaySearch.ts — eBay search for sports cards
// src/hooks/useSportsGemRate.ts — gem rate calculation
// src/hooks/useSportsQueryBuilderState.ts — sports filter state machine
// src/hooks/useSportsRulesetSnapshot.ts — loads published ruleset snapshot
// src/hooks/useRoiCards.ts — ROI card data + eBay listing prefetch
// src/hooks/useWatchlist.ts — generic watchlist CRUD
// src/hooks/useRecommendations.ts — recommendation logic
// src/hooks/useCountdown.ts — countdown timer utility`,
      },
      {
        label: 'Representative fetch pathway: TCG search',
        code: `// 1. TerminalView calls useInfiniteQuery with searchActiveListings(query, filters, limit, offset)
// 2. searchActiveListings (src/services/tcgEbayService.ts):
//    const { data, error } = await supabase.functions.invoke('tcg-ebay-search', {
//      body: { action: 'active', query, limit, offset, ...filters }
//    });
// 3. Edge function tcg-ebay-search calls eBay Finding API with ***REDACTED*** credentials
// 4. Response: { listings: EbayListing[], total, hasMore, nextOffset }
// 5. Client-side: filterListings() + sortListings() + dedupeTcgListings()`,
      },
    ],
    notes: [
      'All eBay API calls go through Supabase Edge Functions (never called directly from client).',
      'React Query handles caching with default config (no custom staleTime/gcTime overrides at provider level).',
      'WatchlistContext uses localStorage-backed device ID for anonymous persistence.',
    ],
  };
}

function sectionD(): AuditSection {
  return {
    id: 'auth-gating',
    title: 'D) Auth / Gating',
    detectedComponents: [],
    codeExcerpts: [],
    notes: [
      'No authentication or gating system is currently implemented.',
      'All routes are publicly accessible.',
      'Supabase auth tables exist (user_roles with app_role enum) but are not wired into the frontend.',
    ],
  };
}

function sectionE(): AuditSection {
  return {
    id: 'styling-tokens',
    title: 'E) Styling / Design Tokens',
    detectedComponents: [
      'tailwind.config.ts — Custom theme with CSS variable colors, fonts, animations',
      'src/index.css — Design tokens (:root + .dark), OmniMarket component classes',
      'src/lib/utils.ts — cn() utility (clsx + tailwind-merge)',
      'components.json — shadcn/ui config',
    ],
    codeExcerpts: [
      {
        label: 'Key CSS tokens (index.css)',
        code: `/* Fonts: Inter (body), Space Grotesk (display) */
/* Color tokens (both :root and .dark): */
--background / --foreground — page bg/text
--primary / --primary-foreground — accent actions
--om-bg-0/1/2 — layered surface backgrounds
--om-text-0/1/2/3 — text hierarchy
--om-border-0/1 — border hierarchy
--om-accent — blue accent (10,132,255 variants)
--om-danger — error red
--om-success — success green
/* Component classes: .om-card, .om-input, .om-btn, .om-pill, .om-toolbar, .om-surface-0/1/2 */
/* Glass: .glass-panel with backdrop-blur + shadow */`,
      },
      {
        label: 'tailwind.config.ts summary',
        code: `// darkMode: ["class"]
// fonts: sans(Inter), display(Space Grotesk), serif(Georgia), mono(Menlo)
// colors: all via hsl(var(--*)) — sidebar, auction, buyNow, price, shipping, success, om-*
// animations: accordion, shimmer, fadeIn
// shadows: card, cardHover
// plugin: tailwindcss-animate`,
      },
      {
        label: 'cn() utility',
        code: `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }`,
      },
    ],
    notes: [
      'Design system is CSS-variable driven — all colors defined as HSL in index.css.',
      'Dark mode is the default; light mode supported via class toggle.',
      'OmniMarket-specific classes (om-*) provide a consistent component library layer.',
    ],
  };
}

export function generateMarkdownReport(sections: AuditSection[], snapshotsJson: string): string {
  const lines: string[] = [];
  lines.push('# UI Audit Report — OmniMarket');
  lines.push(`Generated: ${new Date().toISOString()}\n`);

  for (const section of sections) {
    lines.push(`## ${section.title}\n`);

    if (section.detectedComponents.length > 0) {
      lines.push('### Detected Components');
      for (const c of section.detectedComponents) lines.push(`- ${c}`);
      lines.push('');
    }

    for (const excerpt of section.codeExcerpts) {
      lines.push(`### ${excerpt.label}`);
      lines.push('```tsx');
      lines.push(excerpt.code);
      lines.push('```\n');
    }

    if (section.notes.length > 0) {
      lines.push('### Notes');
      for (const n of section.notes) lines.push(`- ${n}`);
      lines.push('');
    }
  }

  lines.push('## Snapshots\n');
  lines.push('```json');
  lines.push(snapshotsJson);
  lines.push('```');

  return lines.join('\n');
}
