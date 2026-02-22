"use client";

import { Check } from "lucide-react";
import { LucideIcon } from "@/components/shared/lucide-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  icon: string;
  toolCount?: number;
}

interface CategoryFilterProps {
  /**
   * Available categories
   */
  categories: Category[];
  /**
   * Currently selected category ID
   */
  selected: string | null;
  /**
   * Callback when category is selected
   */
  onSelect: (categoryId: string | null) => void;
  /**
   * Layout variant
   * @default "horizontal"
   */
  variant?: "horizontal" | "vertical" | "badges";
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function CategoryFilter({
  categories,
  selected,
  onSelect,
  variant = "horizontal",
  className,
}: CategoryFilterProps): React.ReactElement {
  if (variant === "badges") {
    return (
      <div
        role="radiogroup"
        aria-label="Filter by category"
        className={cn("flex flex-wrap gap-2", className)}
      >
        <Badge
          variant={selected === null ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => onSelect(null)}
          role="radio"
          aria-checked={selected === null}
          aria-label="Show all categories"
        >
          All
        </Badge>
        {categories.map((category) => (
          <Badge
            key={category.id}
            variant={selected === category.id ? "default" : "outline"}
            className="cursor-pointer gap-1"
            onClick={() => onSelect(category.id)}
            role="radio"
            aria-checked={selected === category.id}
            aria-label={`Filter by ${category.name}`}
          >
            <LucideIcon name={category.icon} className="h-3.5 w-3.5" />
            <span>{category.name}</span>
            {category.toolCount !== undefined && (
              <span className="text-xs opacity-75">({category.toolCount})</span>
            )}
          </Badge>
        ))}
      </div>
    );
  }

  if (variant === "vertical") {
    return (
      <div
        role="radiogroup"
        aria-label="Filter by category"
        className={cn("space-y-1", className)}
      >
        <Button
          variant={selected === null ? "secondary" : "ghost"}
          size="sm"
          className="w-full justify-start"
          onClick={() => onSelect(null)}
          role="radio"
          aria-checked={selected === null}
          aria-label="Show all tools"
        >
          {selected === null && <Check className="mr-2 h-4 w-4" />}
          All Tools
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selected === category.id ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start"
            onClick={() => onSelect(category.id)}
            role="radio"
            aria-checked={selected === category.id}
            aria-label={`Filter by ${category.name}`}
          >
            {selected === category.id && <Check className="mr-2 h-4 w-4" />}
            <LucideIcon name={category.icon} className="mr-2 h-4 w-4" />
            <span className="flex-1 text-left">{category.name}</span>
            {category.toolCount !== undefined && (
              <span className="text-muted-foreground text-xs">
                {category.toolCount}
              </span>
            )}
          </Button>
        ))}
      </div>
    );
  }

  // Horizontal (default)
  return (
    <ScrollArea className={cn("w-full whitespace-nowrap", className)}>
      <div
        role="radiogroup"
        aria-label="Filter by category"
        className="flex gap-2 pb-2"
      >
        <Button
          variant={selected === null ? "default" : "outline"}
          size="sm"
          onClick={() => onSelect(null)}
          role="radio"
          aria-checked={selected === null}
          aria-label="Show all categories"
        >
          All
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selected === category.id ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={() => onSelect(category.id)}
            role="radio"
            aria-checked={selected === category.id}
            aria-label={`Filter by ${category.name}`}
          >
            <LucideIcon name={category.icon} className="h-4 w-4" />
            <span>{category.name}</span>
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
