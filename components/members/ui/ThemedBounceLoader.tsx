'use client';

import React, { useEffect, useState } from 'react';
import BounceLoader from 'react-spinners/BounceLoader';

interface ThemedBounceLoaderProps {
  loading: boolean;
  size?: number;
  ariaLabel?: string;
  dataTestid?: string;
}

export default function ThemedBounceLoader({
  loading,
  size = 60,
  ariaLabel = 'Loading Spinner',
  dataTestid = 'loader',
}: ThemedBounceLoaderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);
    const changeHandler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', changeHandler);
    return () => mediaQuery.removeEventListener('change', changeHandler);
  }, []);

  return (
    <BounceLoader
      color={isDarkMode ? '#0ea5e9' : '#40beb3'}
      loading={loading}
      size={size}
      aria-label={ariaLabel}
      data-testid={dataTestid}
    />
  );
}
