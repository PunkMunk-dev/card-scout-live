import type { ReactNode } from 'react';
import { ScannerContext, useScannerReducer } from '@/hooks/useScannerState';

export function ScannerProvider({ children }: { children: ReactNode }) {
  const scanner = useScannerReducer();
  return (
    <ScannerContext.Provider value={scanner}>
      {children}
    </ScannerContext.Provider>
  );
}
