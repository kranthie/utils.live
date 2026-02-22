"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface ShortcutHandler {
  id: string;
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  handler: () => void;
  description?: string;
  preventDefault?: boolean;
}

interface KeyboardContextValue {
  registerShortcut: (shortcut: ShortcutHandler) => void;
  unregisterShortcut: (id: string) => void;
  shortcuts: ShortcutHandler[];
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}

const KeyboardContext = createContext<KeyboardContextValue | null>(null);

interface KeyboardProviderProps {
  children: ReactNode;
}

export function KeyboardProvider({
  children,
}: KeyboardProviderProps): React.ReactElement {
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [shortcuts, setShortcuts] = useState<ShortcutHandler[]>([]);

  const registerShortcut = useCallback((shortcut: ShortcutHandler) => {
    setShortcuts((prev) => {
      // Replace if already exists
      const filtered = prev.filter((s) => s.id !== shortcut.id);
      return [...filtered, shortcut];
    });
  }, []);

  const unregisterShortcut = useCallback((id: string) => {
    setShortcuts((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Use a ref for shortcuts inside the keydown handler to avoid
  // re-registering the listener on every shortcut change
  const shortcutsRef = useRef(shortcuts);
  const isSearchOpenRef = useRef(isSearchOpen);

  // Sync refs in a layout-safe way using an effect
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    isSearchOpenRef.current = isSearchOpen;
  }, [isSearchOpen]);

  // Global keyboard listener (registered once)
  useEffect(() => {
    const isMac =
      typeof navigator !== "undefined" &&
      ("userAgentData" in navigator && navigator.userAgentData
        ? (navigator.userAgentData as { platform: string }).platform === "macOS"
        : /mac/i.test(navigator.userAgent));

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (!e.key) return;

      // Don't trigger shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.closest('[role="textbox"]');

      // Handle built-in shortcuts first (Cmd/Ctrl+K and Escape)
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (e.key.toLowerCase() === "k" && cmdOrCtrl) {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }

      if (e.key === "Escape") {
        setSearchOpen(false);
        return;
      }

      // Find matching registered shortcut
      const matchingShortcut = shortcutsRef.current.find((shortcut) => {
        if (e.key.toLowerCase() !== shortcut.key.toLowerCase()) {
          return false;
        }

        const shortcutCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

        if (shortcut.ctrlKey && !e.ctrlKey) return false;
        if (shortcut.metaKey && !shortcutCmdOrCtrl) return false;
        if (shortcut.shiftKey && !e.shiftKey) return false;
        if (shortcut.altKey && !e.altKey) return false;

        return true;
      });

      if (matchingShortcut) {
        if (isInputField) {
          return;
        }

        if (matchingShortcut.preventDefault !== false) {
          e.preventDefault();
        }
        matchingShortcut.handler();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Include built-in shortcuts in the shortcuts list for consumers
  // Memoize to prevent cascading re-renders across the entire app
  const allShortcuts = useMemo<ShortcutHandler[]>(
    () => [
      {
        id: "search-open",
        key: "k",
        metaKey: true,
        handler: () => setSearchOpen(true),
        description: "Open search",
      },
      {
        id: "escape",
        key: "Escape",
        handler: () => setSearchOpen(false),
        description: "Close search",
        preventDefault: false,
      },
      ...shortcuts,
    ],
    [shortcuts]
  );

  // Memoize context value to prevent all useKeyboard() consumers from re-rendering
  const value = useMemo(
    () => ({
      registerShortcut,
      unregisterShortcut,
      shortcuts: allShortcuts,
      isSearchOpen,
      setSearchOpen,
    }),
    [registerShortcut, unregisterShortcut, allShortcuts, isSearchOpen]
  );

  return (
    <KeyboardContext.Provider value={value}>
      {children}
    </KeyboardContext.Provider>
  );
}

export function useKeyboard(): KeyboardContextValue {
  const context = useContext(KeyboardContext);
  if (!context) {
    throw new Error("useKeyboard must be used within a KeyboardProvider");
  }
  return context;
}

// Hook for registering a shortcut
export function useShortcut(
  key: string,
  handler: () => void,
  options: {
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    description?: string;
    enabled?: boolean;
  } = {}
): void {
  const { registerShortcut, unregisterShortcut } = useKeyboard();
  const {
    ctrlKey,
    metaKey,
    shiftKey,
    altKey,
    description,
    enabled = true,
  } = options;

  useEffect(() => {
    if (!enabled) return;

    const id = `shortcut-${key}-${ctrlKey}-${metaKey}-${shiftKey}-${altKey}`;

    registerShortcut({
      id,
      key,
      ctrlKey,
      metaKey,
      shiftKey,
      altKey,
      handler,
      description,
    });

    return () => unregisterShortcut(id);
  }, [
    key,
    ctrlKey,
    metaKey,
    shiftKey,
    altKey,
    handler,
    description,
    enabled,
    registerShortcut,
    unregisterShortcut,
  ]);
}
