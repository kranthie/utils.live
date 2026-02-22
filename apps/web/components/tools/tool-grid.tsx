"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ToolTierValue } from "@utils-live/tools/constants";
import { ToolCard } from "./tool-card";
import { EmptyState } from "@/components/display/empty-state";
import { cn } from "@/lib/utils";

type ToolTier = ToolTierValue;

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: ToolTier;
}

interface ToolGridProps {
  /**
   * Tools to display
   */
  tools: Tool[];
  /**
   * User's favorite tool IDs
   */
  favorites?: string[];
  /**
   * Callback when favorite status changes
   */
  onFavoriteChange?: (toolId: string, isFavorite: boolean) => void;
  /**
   * Whether to show loading skeletons
   * @default false
   */
  isLoading?: boolean;
  /**
   * Number of skeleton cards to show when loading
   * @default 12
   */
  skeletonCount?: number;
  /**
   * Grid columns configuration
   * @default { sm: 1, md: 2, lg: 3, xl: 4 }
   */
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  /**
   * Card variant
   * @default "default"
   */
  variant?: "default" | "compact";
  /**
   * Additional CSS classes
   */
  className?: string;
}

function ToolCardSkeleton({
  variant = "default",
}: {
  variant?: "default" | "compact";
}): React.ReactElement {
  if (variant === "compact") {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 p-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="mt-3 h-5 w-2/3" />
        <div className="mt-2 space-y-1">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </CardHeader>
    </Card>
  );
}

export function ToolGrid({
  tools,
  favorites = [],
  onFavoriteChange,
  isLoading = false,
  skeletonCount = 12,
  columns = { sm: 1, md: 2, lg: 3, xl: 4 },
  variant = "default",
  className,
}: ToolGridProps): React.ReactElement {
  const gridCols = cn(
    "grid gap-4",
    columns.sm === 1 && "grid-cols-1",
    columns.sm === 2 && "grid-cols-2",
    columns.md === 2 && "sm:grid-cols-2",
    columns.md === 3 && "sm:grid-cols-3",
    columns.lg === 3 && "lg:grid-cols-3",
    columns.lg === 4 && "lg:grid-cols-4",
    columns.xl === 4 && "xl:grid-cols-4",
    columns.xl === 5 && "xl:grid-cols-5",
    className
  );

  if (isLoading) {
    return (
      <div className={gridCols}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ToolCardSkeleton key={i} variant={variant} />
        ))}
      </div>
    );
  }

  if (tools.length === 0) {
    return (
      <EmptyState
        icon="search"
        title="No tools found"
        description="Try adjusting your search or filter criteria"
      />
    );
  }

  return (
    <div className={gridCols}>
      {tools.map((tool) => (
        <ToolCard
          key={tool.id}
          tool={tool}
          variant={variant}
          isFavorite={favorites.includes(tool.id)}
          onFavoriteChange={
            onFavoriteChange
              ? (isFavorite) => onFavoriteChange(tool.id, isFavorite)
              : undefined
          }
        />
      ))}
    </div>
  );
}
