"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { GripVertical, GripHorizontal } from "lucide-react";
import type { ToolTierValue } from "@utils-live/tools/constants";
import { useIsMobile } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: ToolTierValue;
}

interface ToolLayoutProps {
  /**
   * Tool metadata
   */
  tool: Tool;
  /**
   * Children (typically InputPanel and OutputPanel)
   */
  children: ReactNode;
  /**
   * Panel orientation
   * @default "horizontal" on desktop, "vertical" on mobile
   */
  orientation?: "horizontal" | "vertical";
  /**
   * Initial split ratio (0.0 to 1.0)
   * @default 0.5
   */
  defaultSplitRatio?: number;
  /**
   * Whether panels can be resized
   * @default true
   */
  resizable?: boolean;
  /**
   * Whether to show panel toggle on mobile
   * @default true
   */
  showMobileToggle?: boolean;
  /**
   * Label for the input panel tab on mobile
   * @default "Input"
   */
  inputLabel?: string;
  /**
   * Label for the output panel tab on mobile
   * @default "Output"
   */
  outputLabel?: string;
}

export function ToolLayout({
  tool,
  children,
  orientation: orientationProp,
  defaultSplitRatio = 0.5,
  resizable = true,
  showMobileToggle = true,
  inputLabel = "Input",
  outputLabel = "Output",
}: ToolLayoutProps): React.ReactElement {
  const isMobile = useIsMobile();
  const orientation = orientationProp ?? (isMobile ? "vertical" : "horizontal");

  const splitStorageKey = `utils.live:panel-split:${tool.id}:${orientation}`;

  const [splitRatio, setSplitRatio] = useState(() => {
    try {
      const saved = localStorage.getItem(splitStorageKey);
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0.2 && parsed <= 0.8) return parsed;
      }
    } catch {
      // localStorage unavailable
    }
    return defaultSplitRatio;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [mobileActivePanel, setMobileActivePanel] = useState<
    "input" | "output"
  >("input");

  // Persist split ratio to localStorage when it changes
  useEffect(() => {
    if (!resizable) return;
    try {
      localStorage.setItem(splitStorageKey, String(splitRatio));
    } catch {
      // localStorage unavailable
    }
  }, [splitRatio, splitStorageKey, resizable]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!resizable) return;

      e.preventDefault();
      setIsResizing(true);

      const container = (e.target as HTMLElement).parentElement;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const containerSize =
        orientation === "horizontal"
          ? containerRect.width
          : containerRect.height;

      const handleMouseMove = (moveEvent: MouseEvent): void => {
        const currentPos =
          orientation === "horizontal" ? moveEvent.clientX : moveEvent.clientY;
        const containerStart =
          orientation === "horizontal" ? containerRect.left : containerRect.top;

        const newRatio = (currentPos - containerStart) / containerSize;
        const clampedRatio = Math.max(0.2, Math.min(0.8, newRatio));
        setSplitRatio(clampedRatio);
      };

      const handleMouseUp = (): void => {
        setIsResizing(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [resizable, orientation]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!resizable) return;

      setIsResizing(true);

      const container = (e.target as HTMLElement).parentElement;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const containerSize =
        orientation === "horizontal"
          ? containerRect.width
          : containerRect.height;

      const handleTouchMove = (moveEvent: TouchEvent): void => {
        const touch = moveEvent.touches[0]!;
        const currentPos =
          orientation === "horizontal" ? touch.clientX : touch.clientY;
        const containerStart =
          orientation === "horizontal" ? containerRect.left : containerRect.top;

        const newRatio = (currentPos - containerStart) / containerSize;
        const clampedRatio = Math.max(0.2, Math.min(0.8, newRatio));
        setSplitRatio(clampedRatio);
      };

      const handleTouchEnd = (): void => {
        setIsResizing(false);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };

      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);
    },
    [resizable, orientation]
  );

  // Convert children to array
  const childArray = Array.isArray(children) ? children : [children];
  const [firstPanel, secondPanel] = childArray as [
    React.ReactNode,
    React.ReactNode,
  ];

  // Mobile tabbed view for small screens
  if (isMobile && showMobileToggle) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        {/* Mobile panel toggle */}
        <div
          className="bg-muted/30 flex flex-shrink-0 border-b"
          role="tablist"
          aria-label="Editor panels"
        >
          <button
            type="button"
            role="tab"
            id="tab-input"
            aria-selected={mobileActivePanel === "input"}
            aria-controls="panel-input"
            tabIndex={mobileActivePanel === "input" ? 0 : -1}
            className={cn(
              "flex-1 touch-manipulation px-4 py-3 text-sm font-medium transition-colors",
              mobileActivePanel === "input"
                ? "bg-background border-primary text-primary border-b-2"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setMobileActivePanel("input")}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "ArrowRight") {
                e.preventDefault();
                setMobileActivePanel("output");
                document.getElementById("tab-output")?.focus();
              }
            }}
          >
            {inputLabel}
          </button>
          <button
            type="button"
            role="tab"
            id="tab-output"
            aria-selected={mobileActivePanel === "output"}
            aria-controls="panel-output"
            tabIndex={mobileActivePanel === "output" ? 0 : -1}
            className={cn(
              "flex-1 touch-manipulation px-4 py-3 text-sm font-medium transition-colors",
              mobileActivePanel === "output"
                ? "bg-background border-primary text-primary border-b-2"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setMobileActivePanel("output")}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                setMobileActivePanel("input");
                document.getElementById("tab-input")?.focus();
              }
            }}
          >
            {outputLabel}
          </button>
        </div>

        {/* Panel content */}
        <div className="min-h-0 flex-1 overflow-hidden">
          <div
            id="panel-input"
            role="tabpanel"
            aria-labelledby="tab-input"
            aria-hidden={mobileActivePanel !== "input"}
            className={cn(mobileActivePanel !== "input" && "hidden", "h-full")}
          >
            {firstPanel}
          </div>
          <div
            id="panel-output"
            role="tabpanel"
            aria-labelledby="tab-output"
            aria-hidden={mobileActivePanel !== "output"}
            className={cn(mobileActivePanel !== "output" && "hidden", "h-full")}
          >
            {secondPanel}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full min-h-0 gap-2",
        orientation === "horizontal" ? "flex-row" : "flex-col",
        isResizing && "select-none"
      )}
    >
      {/* First Panel (Input) */}
      <div
        className="min-h-0 min-w-0 overflow-hidden"
        style={{
          [orientation === "horizontal" ? "width" : "height"]:
            `calc(${splitRatio * 100}% - 0.25rem)`,
        }}
      >
        {firstPanel}
      </div>

      {/* Resize Handle */}
      {resizable && (
        <div
          className={cn(
            "panel-resize-handle bg-border/30 hover:bg-border flex-shrink-0 transition-colors",
            orientation === "horizontal"
              ? "w-1 cursor-col-resize"
              : "h-1 cursor-row-resize",
            isResizing && "bg-primary/50"
          )}
          data-orientation={orientation}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          role="separator"
          aria-orientation={orientation}
          aria-valuenow={Math.round(splitRatio * 100)}
          aria-valuemin={20}
          aria-valuemax={80}
          tabIndex={0}
          aria-label="Resize panels"
          onKeyDown={(e: React.KeyboardEvent) => {
            if (!resizable) return;
            const step = e.shiftKey ? 0.1 : 0.02;
            if (
              (orientation === "horizontal" &&
                (e.key === "ArrowLeft" || e.key === "ArrowRight")) ||
              (orientation === "vertical" &&
                (e.key === "ArrowUp" || e.key === "ArrowDown"))
            ) {
              e.preventDefault();
              const delta =
                e.key === "ArrowRight" || e.key === "ArrowDown" ? step : -step;
              setSplitRatio((prev) =>
                Math.max(0.2, Math.min(0.8, prev + delta))
              );
            }
          }}
        >
          {orientation === "horizontal" ? (
            <GripVertical className="text-muted-foreground h-6 w-6" />
          ) : (
            <GripHorizontal className="text-muted-foreground h-6 w-6" />
          )}
        </div>
      )}

      {/* Second Panel (Output) */}
      <div
        className="min-h-0 min-w-0 flex-1 overflow-hidden"
        style={{
          [orientation === "horizontal" ? "width" : "height"]:
            `calc(${(1 - splitRatio) * 100}% - 0.25rem)`,
        }}
      >
        {secondPanel}
      </div>
    </div>
  );
}
