import { useState, type ReactNode } from 'react';
import { Search } from 'lucide-react';

const ALLOWED = import.meta.env.VITE_APP_ACCESS_USERNAME ?? "Jordan9697";

export function AccessGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(
    () => localStorage.getItem("omni_access") === "granted"
  );
  const [value, setValue] = useState('');
  const [hasError, setHasError] = useState(false);

  if (unlocked) return <>{children}</>;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    if (value.trim() === ALLOWED) {
      localStorage.setItem("omni_access", "granted");
      localStorage.setItem("omni_user", value.trim());
      setUnlocked(true);
    } else {
      setHasError(true);
      setTimeout(() => setHasError(false), 500);
    }
  };

  return (
    <>
      <style>{`
        @keyframes gate-shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: '#05060A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        {/* radial glow */}
        <div
          style={{
            position: 'absolute',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,185,255,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        {/* noise overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.03,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            pointerEvents: 'none',
          }}
        />

        {/* command bar */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '620px',
            padding: '0 4vw',
          }}
        >
          <div
            style={{
              position: 'relative',
              animation: hasError ? 'gate-shake 0.4s ease' : undefined,
            }}
          >
            <Search
              style={{
                position: 'absolute',
                left: '18px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(245,247,255,0.55)',
                width: '20px',
                height: '20px',
                pointerEvents: 'none',
              }}
            />
            <input
              autoFocus
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search… (type access username)"
              style={{
                width: '100%',
                height: '56px',
                borderRadius: '20px',
                background: hasError ? 'rgba(255,92,122,0.06)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${hasError ? 'rgba(255,92,122,0.7)' : 'rgba(255,255,255,0.10)'}`,
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                color: '#F5F7FF',
                fontSize: '15px',
                paddingLeft: '50px',
                paddingRight: '18px',
                outline: 'none',
                transition: 'border 0.2s, background 0.2s, box-shadow 0.2s, transform 0.15s',
                boxShadow: 'none',
              }}
              onFocus={(e) => {
                if (!hasError) {
                  e.currentTarget.style.border = '1px solid rgba(10,132,255,0.55)';
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(10,132,255,0.22)';
                }
              }}
              onBlur={(e) => {
                if (!hasError) {
                  e.currentTarget.style.border = '1px solid rgba(255,255,255,0.10)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.09)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = hasError ? 'rgba(255,92,122,0.06)' : 'rgba(255,255,255,0.06)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            />
          </div>
          <p
            style={{
              textAlign: 'center',
              marginTop: '14px',
              fontSize: '11px',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: hasError ? 'rgba(255,92,122,0.7)' : 'rgba(245,247,255,0.35)',
              transition: 'color 0.2s',
            }}
          >
            {hasError ? 'Access denied' : 'Press Enter to unlock'}
          </p>
        </div>
      </div>
    </>
  );
}
