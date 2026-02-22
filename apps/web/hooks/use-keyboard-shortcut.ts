"use client";

import { useEffect, useCallback, useRef } from "react";

type Modifier = "meta" | "ctrl" | "alt" | "shift";

interface UseKeyboardShortcutOptions {
  /**
   * Whether the shortcut is enabled
   * @default true
   */
  enabled?: boolean;
  /**
   * Whether to prevent the default browser behavior
   * @default true
   */
  preventDefault?: boolean;
  /**
   * Whether to stop event propagation
   * @default false
   */
  stopPropagation?: boolean;
  /**
   * Element ref to scope the shortcut to (defaults to document)
   */
  targetRef?: React.RefObject<HTMLElement>;
}

/**
 * Hook for handling keyboard shortcuts.
 * Supports modifier keys (meta, ctrl, alt, shift) and any key combination.
 *
 * @param keys - Array of modifier keys followed by the main key (e.g., ['meta', 'k'])
 * @param callback - Function to call when shortcut is triggered
 * @param options - Configuration options
 */
export function useKeyboardShortcut(
  keys: string[],
  callback: (event: KeyboardEvent) => void,
  options: UseKeyboardShortcutOptions = {}
): void {
  const {
    enabled = true,
    preventDefault = true,
    stopPropagation = false,
    targetRef,
  } = options;

  const callbackRef = useRef(callback);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || !event.key) return;

      // Parse modifiers and main key from the keys array
      const modifiers = keys.filter((k): k is Modifier =>
        ["meta", "ctrl", "alt", "shift"].includes(k)
      );
      const mainKey = keys.find(
        (k) => !["meta", "ctrl", "alt", "shift"].includes(k)
      );

      if (!mainKey) return;

      // Check if all required modifiers are pressed
      const modifiersMatch =
        modifiers.includes("meta") === (event.metaKey || event.ctrlKey) &&
        modifiers.includes("alt") === event.altKey &&
        modifiers.includes("shift") === event.shiftKey;

      // Special handling: treat ctrl as meta on non-Mac platforms
      const isCtrlOrMeta =
        modifiers.includes("meta") || modifiers.includes("ctrl");
      const ctrlMetaMatch = isCtrlOrMeta
        ? event.metaKey || event.ctrlKey
        : !event.metaKey && !event.ctrlKey;

      // Check if the main key matches (case insensitive)
      const keyMatches = event.key.toLowerCase() === mainKey.toLowerCase();

      // Also check for key code for special keys
      const keyCodeMatches =
        (mainKey === "Enter" && event.key === "Enter") ||
        (mainKey === "Escape" && event.key === "Escape") ||
        (mainKey === "Space" && event.key === " ") ||
        (mainKey === "Tab" && event.key === "Tab");

      if ((keyMatches || keyCodeMatches) && modifiersMatch && ctrlMetaMatch) {
        if (preventDefault) {
          event.preventDefault();
        }
        if (stopPropagation) {
          event.stopPropagation();
        }
        callbackRef.current(event);
      }
    },
    [keys, enabled, preventDefault, stopPropagation]
  );

  useEffect(() => {
    const target = targetRef?.current ?? document;

    target.addEventListener("keydown", handleKeyDown as EventListener);

    return () => {
      target.removeEventListener("keydown", handleKeyDown as EventListener);
    };
  }, [handleKeyDown, targetRef]);
}
