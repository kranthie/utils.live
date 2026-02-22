"use client";

import { AlertCircle, AlertTriangle, Info, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorDisplayProps {
  /**
   * Error type/severity
   * @default "error"
   */
  type?: "error" | "warning" | "info";
  /**
   * Error title
   */
  title?: string;
  /**
   * Error message/description
   */
  message: string;
  /**
   * Error details (e.g., line number, column)
   */
  details?: {
    line?: number;
    column?: number;
    path?: string;
  };
  /**
   * Callback for retry action
   */
  onRetry?: () => void;
  /**
   * Callback for dismiss action
   */
  onDismiss?: () => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const icons = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const variants = {
  error: "destructive" as const,
  warning: "default" as const,
  info: "default" as const,
};

const defaultTitles = {
  error: "Error",
  warning: "Warning",
  info: "Information",
};

export function ErrorDisplay({
  type = "error",
  title,
  message,
  details,
  onRetry,
  onDismiss,
  className,
}: ErrorDisplayProps): React.ReactElement {
  const Icon = icons[type];
  const displayTitle = title ?? defaultTitles[type];

  return (
    <Alert
      variant={variants[type]}
      className={cn("relative", className)}
      role="alert"
    >
      <Icon className="h-4 w-4" />
      <AlertTitle>{displayTitle}</AlertTitle>
      <AlertDescription>
        <div className="space-y-2">
          <p>{message}</p>
          {details && (details.line !== undefined || details.path) && (
            <div className="font-mono text-xs opacity-75">
              {details.path && <span>Path: {details.path}</span>}
              {details.line !== undefined && (
                <span className="ml-2">
                  Line {details.line}
                  {details.column !== undefined && `:${details.column}`}
                </span>
              )}
            </div>
          )}
          {(onRetry || onDismiss) && (
            <div className="flex gap-2 pt-2">
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="h-7"
                >
                  <RefreshCw className="mr-1.5 h-3 w-3" />
                  Retry
                </Button>
              )}
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="h-7"
                >
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
