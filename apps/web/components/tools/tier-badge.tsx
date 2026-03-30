"use client";

import { Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TierBadgeProps {
  /**
   * Badge size
   * @default "default"
   */
  size?: "sm" | "default" | "lg";
  /**
   * Whether to show the tier label text
   * @default true
   */
  showLabel?: boolean;
}

const sizeClasses = {
  sm: { badge: "h-5 px-1.5 text-[10px]", icon: "h-3 w-3", gap: "gap-0.5" },
  default: { badge: "h-6 px-2 text-xs", icon: "h-3.5 w-3.5", gap: "gap-1" },
  lg: { badge: "h-7 px-2.5 text-sm", icon: "h-4 w-4", gap: "gap-1.5" },
};

export function TierBadge({
  size = "default",
  showLabel = true,
}: TierBadgeProps): React.ReactElement {
  const badge = (
    <Badge
      variant="secondary"
      className={cn(
        "bg-green-500/10 font-medium",
        sizeClasses[size].badge,
        sizeClasses[size].gap
      )}
    >
      <Zap className={cn("text-green-500", sizeClasses[size].icon)} />
      {showLabel && <span className="text-green-500">Browser</span>}
    </Badge>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">Runs in your browser</p>
          <p className="text-muted-foreground text-xs">
            No data sent to servers.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
