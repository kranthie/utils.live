"use client";

import Link from "next/link";
import { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  count: number;
  href: string;
}

interface CategoryNavProps {
  /**
   * List of categories to display
   */
  categories: Category[];
  /**
   * Currently active category ID
   */
  activeCategory?: string;
  /**
   * Whether to show tool counts
   * @default true
   */
  showCounts?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function CategoryNav({
  categories,
  activeCategory,
  showCounts = true,
  className,
}: CategoryNavProps): React.ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const scrollArea = scrollRef.current;
    if (!scrollArea) return;
    const viewport = scrollArea.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    if (!viewport) return;

    const { scrollLeft, scrollWidth, clientWidth } = viewport;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  // Attach scroll listener to the Radix viewport
  useEffect(() => {
    const scrollArea = scrollRef.current;
    if (!scrollArea) return;
    const viewport = scrollArea.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    if (!viewport) return;

    viewport.addEventListener("scroll", updateScrollState);
    updateScrollState();

    window.addEventListener("resize", updateScrollState);
    return () => {
      viewport.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  // Scroll active category into view on mount
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const activeElement = activeRef.current;
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeElement.getBoundingClientRect();

      // Check if active element is outside visible area
      if (
        activeRect.left < containerRect.left ||
        activeRect.right > containerRect.right
      ) {
        activeElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [activeCategory]);

  // Sort categories: active first, then alphabetically
  const sortedCategories = [...categories].sort((a, b) => {
    if (a.id === activeCategory) return -1;
    if (b.id === activeCategory) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        {canScrollLeft && (
          <div className="from-background pointer-events-none absolute top-0 left-0 z-10 h-full w-8 bg-gradient-to-r to-transparent" />
        )}
        {canScrollRight && (
          <div className="from-background pointer-events-none absolute top-0 right-0 z-10 h-full w-8 bg-gradient-to-l to-transparent" />
        )}
        <ScrollArea className="w-full" ref={scrollRef}>
          <div className="flex gap-2 pb-2">
            {/* All tools link */}
            <Link href="/tools" ref={!activeCategory ? activeRef : undefined}>
              <Button
                variant={!activeCategory ? "default" : "outline"}
                size="sm"
                className="whitespace-nowrap"
              >
                All Tools
                {showCounts && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "ml-2",
                      !activeCategory && "bg-primary-foreground/20"
                    )}
                  >
                    {categories.reduce((sum, cat) => sum + cat.count, 0)}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Category links */}
            {sortedCategories.map((category) => {
              const isActive = category.id === activeCategory;

              return (
                <Link
                  key={category.id}
                  href={category.href}
                  ref={isActive ? activeRef : undefined}
                >
                  <Button
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className="whitespace-nowrap"
                  >
                    {category.name}
                    {showCounts && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          "ml-2",
                          isActive && "bg-primary-foreground/20"
                        )}
                      >
                        {category.count}
                      </Badge>
                    )}
                  </Button>
                </Link>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
