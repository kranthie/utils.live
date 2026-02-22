"use client";

import { useEffect } from "react";

interface ToolShortcutsOptions {
  /**
   * Handler for execute shortcut (Cmd/Ctrl + Enter)
   */
  onExecute?: () => void;
  /**
   * Handler for copy output shortcut (Cmd/Ctrl + Shift + C)
   */
  onCopyOutput?: () => void;
  /**
   * Handler for clear input shortcut (Cmd/Ctrl + Shift + X)
   */
  onClearInput?: () => void;
  /**
   * Handler for focus input shortcut (Cmd/Ctrl + I)
   */
  onFocusInput?: () => void;
  /**
   * Whether shortcuts are enabled
   * @default true
   */
  enabled?: boolean;
}

/**
 * Hook for registering tool-specific keyboard shortcuts
 */
export function useToolShortcuts({
  onExecute,
  onCopyOutput,
  onClearInput,
  onFocusInput,
  enabled = true,
}: ToolShortcutsOptions): void {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      const isMac =
        "userAgentData" in navigator && navigator.userAgentData
          ? (navigator.userAgentData as { platform: string }).platform === "macOS"
          : /mac/i.test(navigator.userAgent);
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (!cmdOrCtrl) return;

      // Cmd/Ctrl + Enter to execute
      if (e.key === "Enter" && onExecute) {
        e.preventDefault();
        onExecute();
        return;
      }

      // Cmd/Ctrl + Shift + C to copy output
      if (e.key === "c" && e.shiftKey && onCopyOutput) {
        e.preventDefault();
        onCopyOutput();
        return;
      }

      // Cmd/Ctrl + Shift + X to clear input
      if (e.key === "x" && e.shiftKey && onClearInput) {
        e.preventDefault();
        onClearInput();
        return;
      }

      // Cmd/Ctrl + I to focus input
      if (e.key === "i" && onFocusInput) {
        e.preventDefault();
        onFocusInput();
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled, onExecute, onCopyOutput, onClearInput, onFocusInput]);
}
