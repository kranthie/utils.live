"use client";

import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ToolCardSkeletonProps {
  /**
   * Card variant matching ToolCard
   * @default "default"
   */
  variant?: "default" | "compact";
}

export function ToolCardSkeleton({
  variant = "default",
}: ToolCardSkeletonProps): React.ReactElement {
  if (variant === "compact") {
    return (
      <Card>
        <div className="flex items-center gap-3 p-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-full" />
          </div>
          <Skeleton className="h-5 w-12" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="mt-3 h-5 w-32" />
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </CardHeader>
    </Card>
  );
}

/**
 * Render multiple tool card skeletons in a grid.
 */
export function ToolCardSkeletonGrid({
  count = 12,
  variant = "default",
}: {
  count?: number;
  variant?: "default" | "compact";
}): React.ReactElement {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ToolCardSkeleton key={i} variant={variant} />
      ))}
    </div>
  );
}
