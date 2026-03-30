import { Skeleton } from "@/components/ui/skeleton";

export default function MarketingLoading(): React.ReactElement {
  return (
    <div className="container py-16 sm:py-24">
      <div className="mx-auto max-w-3xl space-y-6 text-center">
        <Skeleton className="mx-auto h-12 w-3/4" />
        <Skeleton className="mx-auto h-6 w-1/2" />
      </div>
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    </div>
  );
}
