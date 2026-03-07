import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { OmniOrb } from '@/components/branding/OmniOrb';
import { MarketplaceBadges } from './MarketplaceBadges';
import { FeaturesSection } from './FeaturesSection';

const EXAMPLE_SEARCHES = [
  'pokemon cards psa 10',
  'rolex submariner',
  'macbook pro m3',
  'vintage nike sneakers',
];

export function LandingHero() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (q?: string) => {
    const term = (q || query).trim();
    if (!term) return;
    navigate(`/?q=${encodeURIComponent(term)}`);
  };

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-56px)]">
      {/* Hero */}
      <div className="flex flex-col items-center text-center pt-16 md:pt-24 pb-8 px-4 w-full max-w-3xl mx-auto">
        {/* Ambient glow */}
        <div className="relative mb-8">
          <div
            className="absolute inset-0 -m-8 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(0,224,198,0.15) 0%, rgba(59,130,246,0.08) 50%, transparent 70%)',
              filter: 'blur(30px)',
            }}
          />
          <OmniOrb variant={1} size={72} className="relative z-10" />
        </div>

        {/* Wordmark */}
        <h2
          className="text-xs font-semibold tracking-[0.12em] uppercase mb-6"
          style={{ color: 'var(--om-text-3)' }}
        >
          OMNIMARKET
        </h2>

        {/* Headline */}
        <h1
          className="font-display text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.1] mb-4"
          style={{ color: 'var(--om-text-0)' }}
        >
          Search every marketplace
          <br />
          on the internet.
        </h1>

        {/* Subheadline */}
        <p
          className="text-sm sm:text-base max-w-lg leading-relaxed mb-10"
          style={{ color: 'var(--om-text-2)' }}
        >
          OmniMarket uses AI to find the best listings across every trusted marketplace in real time.
        </p>

        {/* Search bar */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
          className="w-full max-w-xl relative"
        >
          <div
            className="flex items-center rounded-full h-14 px-5 transition-all duration-200"
            style={{
              background: 'var(--glass-fill)',
              border: '1px solid var(--glass-border)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 60px var(--glass-shadow)',
            }}
          >
            <Search className="h-4.5 w-4.5 shrink-0 mr-3" style={{ color: 'var(--om-text-3)' }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search any product across the internet…"
              className="flex-1 bg-transparent outline-none text-sm placeholder:opacity-40"
              style={{ color: 'var(--om-text-0)' }}
            />
            <button
              type="submit"
              disabled={!query.trim()}
              className="shrink-0 h-9 px-4 rounded-full font-semibold text-xs flex items-center gap-1.5 transition-all duration-200 disabled:opacity-30"
              style={{
                background: '#00E0C6',
                color: '#0B0B0C',
              }}
            >
              Search
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>

        {/* Example pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
          {EXAMPLE_SEARCHES.map((term) => (
            <button
              key={term}
              onClick={() => handleSearch(term)}
              className="px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-150 hover:-translate-y-px cursor-pointer"
              style={{
                background: 'var(--om-bg-2)',
                color: 'var(--om-text-2)',
                border: '1px solid var(--om-border-0)',
              }}
            >
              {term}
            </button>
          ))}
        </div>

        {/* Marketplace badges */}
        <div className="mt-12">
          <MarketplaceBadges />
        </div>
      </div>

      {/* Features */}
      <FeaturesSection />
    </div>
  );
}
