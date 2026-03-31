"use client";

import { Link } from "@/i18n/navigation";
import { LucideIcon } from "@/components/shared/lucide-icon";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ToolCardMediumProps {
  tool: {
    id: string;
    name: string;
    description: string;
    icon: string;
  };
  className?: string;
}

export function ToolCardMedium({
  tool,
  className,
}: ToolCardMediumProps): React.ReactElement {
  return (
    <Link href={`/tools/${tool.id}`} className={cn("block h-full", className)}>
      <Card className="hover:border-brand/50 h-full transition-colors transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-3 p-3 sm:p-4">
          <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-md">
            <LucideIcon
              name={tool.icon}
              className="text-muted-foreground h-5 w-5"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{tool.name}</p>
            <p className="text-muted-foreground line-clamp-1 text-sm">
              {tool.description}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
