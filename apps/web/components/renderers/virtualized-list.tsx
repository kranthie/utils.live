"use client";

import { useRef, type ReactNode } from "react";
import { useVirtualizer, type Virtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";

interface VirtualizedListProps<T> {
  /**
   * The items to render
   */
  items: T[];
  /**
   * Render function for each item
   */
  renderItem: (item: T, index: number) => ReactNode;
  /**
   * Estimated height of each item in pixels
   * @default 40
   */
  itemHeight?: number;
  /**
   * Maximum height of the container
   * @default 400
   */
  maxHeight?: number;
  /**
   * Number of items to render above/below the visible area
   * @default 5
   */
  overscan?: number;
  /**
   * Unique key extractor for each item
   */
  getKey?: (item: T, index: number) => string | number;
  /**
   * Element to show when the list is empty
   */
  emptyElement?: ReactNode;
  /**
   * Additional CSS classes for the container
   */
  className?: string;
  /**
   * Additional CSS classes for each item wrapper
   */
  itemClassName?: string;
  /**
   * Minimum number of items before virtualization kicks in
   * Below this threshold, items render normally
   * @default 20
   */
  virtualizeThreshold?: number;
}

/**
 * A virtualized list component for efficiently rendering large lists.
 * Only renders items that are visible in the viewport.
 */
export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight = 40,
  maxHeight = 400,
  overscan = 5,
  getKey,
  emptyElement,
  className,
  itemClassName,
  virtualizeThreshold = 20,
}: VirtualizedListProps<T>): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);

  const shouldVirtualize = items.length >= virtualizeThreshold;

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: (): HTMLDivElement | null => containerRef.current,
    estimateSize: (): number => itemHeight,
    overscan,
  });

  // Empty state
  if (items.length === 0) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        {emptyElement || (
          <span className="text-muted-foreground text-sm">No items</span>
        )}
      </div>
    );
  }

  // Non-virtualized rendering for small lists
  if (!shouldVirtualize) {
    return (
      <div
        className={cn("overflow-auto", className)}
        style={{ maxHeight: `${maxHeight}px` }}
      >
        {items.map((item, index) => (
          <div
            key={getKey ? getKey(item, index) : index}
            className={itemClassName}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    );
  }

  // Virtualized rendering
  return (
    <div
      ref={containerRef}
      className={cn("overflow-auto", className)}
      style={{ maxHeight: `${maxHeight}px` }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = items[virtualItem.index]!;
          return (
            <div
              key={getKey ? getKey(item, virtualItem.index) : virtualItem.index}
              className={itemClassName}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Hook for custom virtualization scenarios.
 * Returns the virtualizer instance for full control.
 */
export function useListVirtualizer<
  T,
  TScrollElement extends Element = HTMLElement,
>(options: {
  items: T[];
  containerRef: React.RefObject<TScrollElement | null>;
  itemHeight?: number;
  overscan?: number;
}): Virtualizer<TScrollElement, Element> {
  const { items, containerRef, itemHeight = 40, overscan = 5 } = options;

  return useVirtualizer({
    count: items.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => itemHeight,
    overscan,
  });
}
