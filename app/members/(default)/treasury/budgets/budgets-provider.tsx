// app/members/(default)/treasury/budgets/_components/BudgetsProvider.tsx
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useTransition,
  useEffect,
} from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface BudgetsContextValue {
  selectedYear: number;
  setSelectedYear: (newYear: number) => void;
}

/** React Context for storing the currently chosen budget year. */
const BudgetsContext = createContext<BudgetsContextValue>({
  selectedYear: 0,
  setSelectedYear: () => {},
});

/**
 * Provide a global `selectedYear` to all child components in this route segment.
 * We also keep the year in the URL param so that refreshing or switching pages
 * preserves the chosen year.
 */
export default function BudgetsProvider({
  children,
  initialYear,
}: {
  children: React.ReactNode;
  initialYear: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // Initialize with the URL param if it exists, otherwise use initialYear
  const yearFromUrl = searchParams.get('year');
  const parsedYear = yearFromUrl ? parseInt(yearFromUrl, 10) : null;
  const [selectedYear, _setSelectedYear] = useState(
    parsedYear && !isNaN(parsedYear) ? parsedYear : initialYear
  );

  // Sync URL with state whenever selectedYear changes
  useEffect(() => {
    const currentYearInUrl = searchParams.get('year');
    const paramNumber = currentYearInUrl
      ? parseInt(currentYearInUrl, 10)
      : null;

    if (paramNumber !== selectedYear) {
      const sp = new URLSearchParams(Array.from(searchParams.entries()));
      sp.set('year', String(selectedYear));

      startTransition(() => {
        router.replace(`${pathname}?${sp.toString()}`);
      });
    }
  }, [selectedYear, searchParams, pathname, router]);

  // External setter to update the year
  function setSelectedYear(newYear: number) {
    if (newYear !== selectedYear) {
      _setSelectedYear(newYear);
    }
  }

  const value: BudgetsContextValue = {
    selectedYear,
    setSelectedYear,
  };

  return (
    <BudgetsContext.Provider value={value}>{children}</BudgetsContext.Provider>
  );
}

/** Convenience hook to access the context. */
export function useSelectedYear() {
  return useContext(BudgetsContext);
}
