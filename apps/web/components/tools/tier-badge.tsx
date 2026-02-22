"use client";

import { Zap, Cloud, Server, Sparkles } from "lucide-react";
import type { ToolTierValue } from "@utils-live/tools/constants";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type ToolTier = ToolTierValue;

interface TierBadgeProps {
  /**
   * Tool tier
   */
  tier: ToolTier;
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

const tierConfig: Record<
  ToolTier,
  {
    label: string;
    description: string;
    icon: typeof Zap;
    color: string;
    bgColor: string;
  }
> = {
  client: {
    label: "Client",
    description: "Runs in your browser. No data sent to servers.",
    icon: Zap,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  "server-light": {
    label: "Light",
    description: "Quick server processing. Uses minimal credits.",
    icon: Cloud,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  "server-heavy": {
    label: "Heavy",
    description: "Intensive server processing. Uses more credits.",
    icon: Server,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  ai: {
    label: "AI",
    description: "Powered by AI. Premium feature.",
    icon: Sparkles,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
};

export function TierBadge({
  tier,
  size = "default",
  showLabel = true,
}: TierBadgeProps): React.ReactElement {
  const config = tierConfig[tier];
  const Icon = config.icon;

  const sizeClasses = {
    sm: {
      badge: "h-5 px-1.5 text-[10px]",
      icon: "h-3 w-3",
      gap: "gap-0.5",
    },
    default: {
      badge: "h-6 px-2 text-xs",
      icon: "h-3.5 w-3.5",
      gap: "gap-1",
    },
    lg: {
      badge: "h-7 px-2.5 text-sm",
      icon: "h-4 w-4",
      gap: "gap-1.5",
    },
  };

  const badge = (
    <Badge
      variant="secondary"
      className={cn(
        "font-medium",
        config.bgColor,
        sizeClasses[size].badge,
        sizeClasses[size].gap
      )}
    >
      <Icon className={cn(config.color, sizeClasses[size].icon)} />
      {showLabel && <span className={config.color}>{config.label}</span>}
    </Badge>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{config.label} Tier</p>
          <p className="text-muted-foreground text-xs">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
