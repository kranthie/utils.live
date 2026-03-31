"use client";

import { memo } from "react";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { LucideIcon } from "@/components/shared/lucide-icon";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface RelatedToolsProps {
  /**
   * Current tool ID (to exclude from list)
   */
  currentToolId: string;
  /**
   * Related tools to display
   */
  tools: Tool[];
  /**
   * Maximum number of tools to show
   * @default 4
   */
  maxTools?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const RelatedTools = memo(function RelatedTools({
  currentToolId,
  tools,
  maxTools = 4,
  className,
}: RelatedToolsProps): React.ReactElement | null {
  const t = useTranslations("tools.relatedTools");
  const filteredTools = tools
    .filter((tool) => tool.id !== currentToolId)
    .slice(0, maxTools);

  if (filteredTools.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-lg font-semibold">{t("title")}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {filteredTools.map((tool) => (
          <Link key={tool.id} href={`/tools/${tool.id}`}>
            <Card className="hover:border-primary/50 group transition-colors">
              <CardContent className="flex items-center gap-3 p-3">
                <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                  <LucideIcon name={tool.icon} className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{tool.name}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {tool.description}
                  </p>
                </div>
                <ArrowRight className="text-muted-foreground h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
});
