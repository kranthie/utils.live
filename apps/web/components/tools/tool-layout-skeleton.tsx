"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-media-query";

interface ToolLayoutSkeletonProps {
  /**
   * Panel orientation
   * @default "horizontal" on desktop, "vertical" on mobile
   */
  orientation?: "horizontal" | "vertical";
}

export function ToolLayoutSkeleton({
  orientation: orientationProp,
}: ToolLayoutSkeletonProps): React.ReactElement {
  const isMobile = useIsMobile();
  const orientation = orientationProp ?? (isMobile ? "vertical" : "horizontal");

  // Mobile tabbed layout skeleton
  if (isMobile) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        {/* Tab bar skeleton */}
        <div className="bg-muted/30 flex flex-shrink-0 gap-1 border-b p-1">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>

        {/* Panel content skeleton */}
        <div className="min-h-0 flex-1 p-4">
          <Skeleton className="h-full min-h-[300px] w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex h-full min-h-0 gap-2 ${
        orientation === "horizontal" ? "flex-row" : "flex-col"
      }`}
    >
      {/* Input Panel Skeleton */}
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full flex-col rounded-lg border">
          {/* Panel header */}
          <div className="flex items-center justify-between border-b px-4 py-2">
            <Skeleton className="h-4 w-16" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
          {/* Editor area */}
          <div className="flex-1 p-4">
            <Skeleton className="h-full min-h-[300px] w-full" />
          </div>
        </div>
      </div>

      {/* Resize Handle Skeleton */}
      <div
        className={`flex-shrink-0 ${
          orientation === "horizontal" ? "w-2" : "h-2"
        }`}
      >
        <Skeleton
          className={`${
            orientation === "horizontal" ? "h-full w-full" : "h-full w-full"
          }`}
        />
      </div>

      {/* Output Panel Skeleton */}
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full flex-col rounded-lg border">
          {/* Panel header */}
          <div className="flex items-center justify-between border-b px-4 py-2">
            <Skeleton className="h-4 w-20" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
          {/* Output area */}
          <div className="flex-1 p-4">
            <Skeleton className="h-full min-h-[300px] w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Full tool page skeleton including header, layout, and sections.
 */
export function ToolPageSkeleton(): React.ReactElement {
  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-2" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-2" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Tool header skeleton */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      {/* Tool layout skeleton */}
      <div className="min-h-[500px]">
        <ToolLayoutSkeleton />
      </div>

      {/* Options skeleton */}
      <div className="space-y-4 rounded-lg border p-4">
        <Skeleton className="h-5 w-24" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Documentation skeleton */}
      <div className="space-y-4 border-t pt-6">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>
    </div>
  );
}
