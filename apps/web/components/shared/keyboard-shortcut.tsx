"use client";

import { cn } from "@/lib/utils";

interface KeyboardShortcutProps {
  /**
   * The keys to display (e.g., ['meta', 'k'] or ['Ctrl', 'Shift', 'P'])
   */
  keys: string[];
  /**
   * Size variant
   * @default "default"
   */
  size?: "sm" | "default" | "lg";
  /**
   * Additional CSS classes
   */
  className?: string;
}

const KEY_SYMBOLS: Record<string, string> = {
  meta: "⌘",
  ctrl: "Ctrl",
  alt: "Alt",
  shift: "⇧",
  enter: "↵",
  escape: "Esc",
  tab: "Tab",
  space: "␣",
  backspace: "⌫",
  delete: "⌦",
  arrowup: "↑",
  arrowdown: "↓",
  arrowleft: "←",
  arrowright: "→",
};

function getKeySymbol(key: string): string {
  const lowerKey = key.toLowerCase();
  return KEY_SYMBOLS[lowerKey] ?? key.toUpperCase();
}

export function KeyboardShortcut({
  keys,
  size = "default",
  className,
}: KeyboardShortcutProps): React.ReactElement {
  const sizeClasses = {
    sm: "text-[10px] px-1 py-0.5 min-w-[18px] gap-0.5",
    default: "text-xs px-1.5 py-0.5 min-w-[22px] gap-1",
    lg: "text-sm px-2 py-1 min-w-[28px] gap-1",
  };

  return (
    <span
      className={cn("inline-flex items-center", className)}
      aria-label={`Keyboard shortcut: ${keys.join(" + ")}`}
    >
      {keys.map((key, index) => (
        <span key={index} className="contents">
          <kbd
            className={cn(
              "border-border inline-flex items-center justify-center rounded border",
              "bg-muted text-muted-foreground font-mono font-medium",
              "shadow-[0_1px_0_1px_rgba(0,0,0,0.1)]",
              "dark:shadow-[0_1px_0_1px_rgba(255,255,255,0.1)]",
              sizeClasses[size]
            )}
          >
            {getKeySymbol(key)}
          </kbd>
          {index < keys.length - 1 && (
            <span className="text-muted-foreground mx-0.5">+</span>
          )}
        </span>
      ))}
    </span>
  );
}
