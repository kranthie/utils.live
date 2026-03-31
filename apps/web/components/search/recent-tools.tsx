"use client";

import { Link } from "@/i18n/navigation";
import { Clock, X } from "lucide-react";
import { LucideIcon } from "@/components/shared/lucide-icon";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface RecentToolsProps {
  /**
   * All available tools (to resolve IDs)
   */
  tools: Tool[];
  /**
   * Maximum number of recent tools to show
   * @default 5
   */
  maxItems?: number;
  /**
   * Callback when a tool is selected
   */
  onSelect?: (tool: Tool) => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function RecentTools({
  tools,
  maxItems = 5,
  onSelect,
  className,
}: RecentToolsProps): React.ReactElement | null {
  const [recentIds, setRecentIds] = useLocalStorage<string[]>(
    "utils.live:recent-tools",
    []
  );

  const recentTools = recentIds
    .map((id) => tools.find((t) => t.id === id))
    .filter((t): t is Tool => t !== undefined)
    .slice(0, maxItems);

  const handleRemove = (toolId: string, e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    setRecentIds((prev) => prev.filter((id) => id !== toolId));
  };

  const handleClearAll = (): void => {
    setRecentIds([]);
  };

  if (recentTools.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
          <Clock className="h-4 w-4" />
          <span>Recent Tools</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearAll}
          className="text-muted-foreground h-7 text-xs"
        >
          Clear all
        </Button>
      </div>
      <div className="space-y-1">
        {recentTools.map((tool) => (
          <Link
            key={tool.id}
            href={`/tools/${tool.id}`}
            onClick={() => onSelect?.(tool)}
            className={cn(
              "flex items-center gap-3 rounded-lg p-2",
              "hover:bg-accent transition-colors",
              "group"
            )}
          >
            <div className="bg-muted flex h-8 w-8 items-center justify-center rounded">
              <LucideIcon name={tool.icon} className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{tool.name}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => handleRemove(tool.id, e)}
              aria-label={`Remove ${tool.name} from recent`}
            >
              <X className="h-3 w-3" />
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}
