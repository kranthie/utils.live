"use client";

import type { ReactNode } from "react";
import { FileQuestion, Search, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /**
   * Icon to display
   * @default "default"
   */
  icon?: "default" | "search" | "folder" | (ReactNode & object);
  /**
   * Title text
   */
  title: string;
  /**
   * Description text
   */
  description?: string;
  /**
   * Primary action button
   */
  action?: {
    label: string;
    onClick: () => void;
  };
  /**
   * Secondary action button
   */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /**
   * Size variant
   * @default "default"
   */
  size?: "sm" | "default" | "lg";
  /**
   * Additional CSS classes
   */
  className?: string;
}

const defaultIcons = {
  default: FileQuestion,
  search: Search,
  folder: FolderOpen,
};

export function EmptyState({
  icon = "default",
  title,
  description,
  action,
  secondaryAction,
  size = "default",
  className,
}: EmptyStateProps): React.ReactElement {
  const sizeClasses = {
    sm: {
      container: "py-6",
      icon: "h-8 w-8",
      title: "text-sm",
      description: "text-xs",
    },
    default: {
      container: "py-10",
      icon: "h-12 w-12",
      title: "text-base",
      description: "text-sm",
    },
    lg: {
      container: "py-16",
      icon: "h-16 w-16",
      title: "text-lg",
      description: "text-base",
    },
  };

  const IconComponent =
    typeof icon === "string" &&
    (icon === "default" || icon === "search" || icon === "folder")
      ? defaultIcons[icon]
      : null;

  return (
    <div
      role="status"
      aria-label={title}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        sizeClasses[size].container,
        className
      )}
    >
      <div className="bg-muted mb-4 rounded-full p-3">
        {IconComponent ? (
          <IconComponent
            className={cn("text-muted-foreground", sizeClasses[size].icon)}
          />
        ) : (
          icon
        )}
      </div>
      <h3
        className={cn("text-foreground font-semibold", sizeClasses[size].title)}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            "text-muted-foreground mt-1 max-w-sm",
            sizeClasses[size].description
          )}
        >
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-4 flex gap-2">
          {action && (
            <Button
              onClick={action.onClick}
              size={size === "sm" ? "sm" : "default"}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
              size={size === "sm" ? "sm" : "default"}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
