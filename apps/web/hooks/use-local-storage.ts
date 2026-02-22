"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Hook for syncing state with localStorage.
 * Handles SSR by initializing with the default value and hydrating on client.
 *
 * @param key - The localStorage key
 * @param defaultValue - The default value if key doesn't exist
 * @returns A tuple of [value, setValue, removeValue]
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        return JSON.parse(stored) as T;
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
    return defaultValue;
  });
  const isHydratedRef = useRef(typeof window !== "undefined");

  // Update localStorage when value changes
  useEffect(() => {
    if (!isHydratedRef.current) {
      isHydratedRef.current = true;
      return;
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing localStorage key "${key}":`, error);
    }
  }, [key, value]);

  const updateValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const resolved =
        typeof newValue === "function"
          ? (newValue as (prev: T) => T)(prev)
          : newValue;
      return resolved;
    });
  }, []);

  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setValue(defaultValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, defaultValue]);

  return [value, updateValue, removeValue];
}
