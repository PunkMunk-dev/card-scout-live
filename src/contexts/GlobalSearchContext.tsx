import { createContext, useContext, useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface SearchHandler {
  onSubmit: (query: string) => void;
}

interface GlobalSearchContextValue {
  register: (handler: SearchHandler) => () => void;
  submitSearch: (query: string) => void;
  globalQuery: string;
  setGlobalQuery: (q: string) => void;
}

const Ctx = createContext<GlobalSearchContextValue | null>(null);

export function GlobalSearchProvider({ children }: { children: React.ReactNode }) {
  const handlerRef = useRef<SearchHandler | null>(null);
  const navigate = useNavigate();
  const [globalQuery, setGlobalQuery] = useState('');

  const register = useCallback((handler: SearchHandler) => {
    handlerRef.current = handler;
    return () => {
      if (handlerRef.current === handler) handlerRef.current = null;
    };
  }, []);

  const submitSearch = useCallback((query: string) => {
    const q = query.trim();
    if (!q) return;
    setGlobalQuery(q);
    if (handlerRef.current) {
      handlerRef.current.onSubmit(q);
    } else {
      navigate(`/?q=${encodeURIComponent(q)}`);
    }
  }, [navigate]);

  return (
    <Ctx.Provider value={{ register, submitSearch, globalQuery, setGlobalQuery }}>
      {children}
    </Ctx.Provider>
  );
}

export function useGlobalSearch() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useGlobalSearch must be used within GlobalSearchProvider');
  return ctx;
}
