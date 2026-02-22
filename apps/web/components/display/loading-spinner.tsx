import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  /**
   * Size variant
   * @default "default"
   */
  size?: "sm" | "default" | "lg" | "xl";
  /**
   * Optional label text
   */
  label?: string;
  /**
   * Whether to center the spinner
   * @default false
   */
  centered?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function LoadingSpinner({
  size = "default",
  label,
  centered = false,
  className,
}: LoadingSpinnerProps): React.ReactElement {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  const textSizes = {
    sm: "text-xs",
    default: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  const spinner = (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <Loader2
        className={cn("text-muted-foreground animate-spin", sizeClasses[size])}
        aria-hidden="true"
      />
      {label && (
        <span className={cn("text-muted-foreground", textSizes[size])}>
          {label}
        </span>
      )}
    </div>
  );

  if (centered) {
    return (
      <div
        className="flex h-full min-h-[100px] w-full items-center justify-center"
        role="status"
        aria-label={label ?? "Loading"}
      >
        {spinner}
      </div>
    );
  }

  return (
    <div role="status" aria-label={label ?? "Loading"}>
      {spinner}
    </div>
  );
}
