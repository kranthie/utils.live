"use client";

import { Link } from "@/i18n/navigation";
import { Heart } from "lucide-react";
import { LucideIcon } from "@/components/shared/lucide-icon";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ToolCardProps {
  /**
   * Tool metadata
   */
  tool: {
    id: string;
    name: string;
    description: string;
    icon: string;
  };
  /**
   * Whether this tool is in user's favorites
   * @default false
   */
  isFavorite?: boolean;
  /**
   * Callback when favorite status changes
   */
  onFavoriteChange?: (isFavorite: boolean) => void;
  /**
   * Card variant
   * @default "default"
   */
  variant?: "default" | "compact";
}

export function ToolCard({
  tool,
  isFavorite = false,
  onFavoriteChange,
  variant = "default",
}: ToolCardProps): React.ReactElement {
  const handleFavoriteClick = (e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    onFavoriteChange?.(!isFavorite);
  };

  if (variant === "compact") {
    return (
      <Link href={`/tools/${tool.id}`}>
        <Card className="hover:border-brand/50 group shadow-sm transition-all hover:shadow-md">
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
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/tools/${tool.id}`}>
      <Card className="hover:border-brand/50 group h-full shadow-sm transition-all hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-lg">
              <LucideIcon name={tool.icon} className="h-6 w-6" />
            </div>
            <div className="flex items-center gap-1">
              {onFavoriteChange && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100",
                    isFavorite && "opacity-100"
                  )}
                  onClick={handleFavoriteClick}
                  aria-label={
                    isFavorite ? "Remove from favorites" : "Add to favorites"
                  }
                >
                  <Heart
                    className={cn(
                      "h-4 w-4",
                      isFavorite && "fill-red-500 text-red-500"
                    )}
                  />
                </Button>
              )}
            </div>
          </div>
          <CardTitle className="mt-3 line-clamp-1 text-lg">
            {tool.name}
          </CardTitle>
          <CardDescription className="line-clamp-2">
            {tool.description}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
