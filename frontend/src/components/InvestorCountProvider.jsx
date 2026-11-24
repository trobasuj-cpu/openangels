'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { DEFAULT_INVESTOR_COUNT, formatInvestorCount } from '@/seo';

const InvestorCountContext = createContext(formatInvestorCount(DEFAULT_INVESTOR_COUNT));

export function InvestorCountProvider({ initialTotal = DEFAULT_INVESTOR_COUNT, children }) {
  const value = useMemo(() => formatInvestorCount(initialTotal), [initialTotal]);
  return (
    <InvestorCountContext.Provider value={value}>
      {children}
    </InvestorCountContext.Provider>
  );
}

export function useInvestorCount() {
  return useContext(InvestorCountContext);
}
