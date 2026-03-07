import { Sparkles, Globe, Zap } from 'lucide-react';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI-Powered Search',
    description: 'Our AI understands what you\'re looking for and finds the best matches across every marketplace.',
  },
  {
    icon: Globe,
    title: 'Every Marketplace',
    description: 'Amazon, eBay, Etsy, StockX, Mercari, Walmart — all in one unified search.',
  },
  {
    icon: Zap,
    title: 'Real-Time Results',
    description: 'Live pricing, availability, and seller ratings updated in real time as you search.',
  },
];

export function FeaturesSection() {
  return (
    <section className="w-full max-w-4xl mx-auto px-4 py-16 md:py-24">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl p-6 text-center transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: 'var(--glass-fill)',
              border: '1px solid var(--glass-border)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div
              className="mx-auto w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(0, 224, 198, 0.1)' }}
            >
              <feature.icon className="h-5 w-5" style={{ color: '#00E0C6' }} />
            </div>
            <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--om-text-0)' }}>
              {feature.title}
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--om-text-2)' }}>
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
