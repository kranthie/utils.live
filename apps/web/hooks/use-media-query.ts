"use client";

import { useSyncExternalStore } from "react";

/**
 * Hook for detecting media query matches.
 * Useful for responsive behavior in components.
 *
 * @param query - The media query string (e.g., "(min-width: 768px)")
 * @returns Boolean indicating whether the query matches
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => {
      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener("change", callback);
      return () => {
        mediaQuery.removeEventListener("change", callback);
      };
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}

/**
 * Pre-defined breakpoint hooks for common use cases
 */
export function useIsMobile(): boolean {
  return !useMediaQuery("(min-width: 768px)");
}

export function useIsTablet(): boolean {
  const isMinTablet = useMediaQuery("(min-width: 768px)");
  const isMinDesktop = useMediaQuery("(min-width: 1024px)");
  return isMinTablet && !isMinDesktop;
}

export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

export function usePrefersDarkMode(): boolean {
  return useMediaQuery("(prefers-color-scheme: dark)");
}
