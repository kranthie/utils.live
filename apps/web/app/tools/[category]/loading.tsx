import { Skeleton } from "@/components/ui/skeleton";
import { ToolCardSkeletonGrid } from "@/components/tools/tool-card-skeleton";

export default function CategoryLoading(): React.ReactElement {
  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-2" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-2" />
        <Skeleton className="h-4 w-20" />
      </div>

      {/* Category header skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      {/* Category navigation skeleton */}
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-full" />
        ))}
      </div>

      {/* Tools grid skeleton */}
      <ToolCardSkeletonGrid count={12} />
    </div>
  );
}
