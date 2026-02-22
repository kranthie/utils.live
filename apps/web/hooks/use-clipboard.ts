"use client";

import { useState, useCallback } from "react";

interface UseClipboardResult {
  copy: (text: string) => Promise<boolean>;
  copied: boolean;
  error: Error | null;
}

/**
 * Hook for copying text to the clipboard.
 * Provides feedback state for UI indication.
 *
 * @param resetDelay - Time in ms before copied state resets (default: 2000ms)
 * @returns Object with copy function, copied state, and error state
 */
export function useClipboard(resetDelay: number = 2000): UseClipboardResult {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setError(null);

        setTimeout(() => {
          setCopied(false);
        }, resetDelay);

        return true;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to copy to clipboard");
        setError(error);
        setCopied(false);
        return false;
      }
    },
    [resetDelay]
  );

  return { copy, copied, error };
}
