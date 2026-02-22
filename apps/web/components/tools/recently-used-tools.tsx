"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { ToolCardMedium } from "./tool-card-medium";
import { cn } from "@/lib/utils";

interface RecentlyUsedToolsProps {
  tools: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    tier: "client" | "server-light" | "server-heavy" | "ai";
  }>;
  maxItems?: number;
  className?: string;
}

export function RecentlyUsedTools({
  tools,
  maxItems = 6,
  className,
}: RecentlyUsedToolsProps): React.ReactElement | null {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [recentIds, , removeValue] = useLocalStorage<string[]>(
    "utils.live:recent-tools",
    []
  );

  const recentTools = useMemo(
    () =>
      recentIds
        .map((id) => tools.find((t) => t.id === id))
        .filter(
          (t): t is RecentlyUsedToolsProps["tools"][number] => t !== undefined
        )
        .slice(0, maxItems),
    [recentIds, tools, maxItems]
  );

  // Don't render on server or before hydration to avoid mismatch
  if (!mounted || recentTools.length === 0) {
    return null;
  }

  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Clock className="text-muted-foreground h-5 w-5" />
          Recently Used
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={removeValue}
          className="text-muted-foreground h-7 text-xs"
        >
          Clear
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {recentTools.map((tool) => (
          <ToolCardMedium key={tool.id} tool={tool} />
        ))}
      </div>
    </section>
  );
}
