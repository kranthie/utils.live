"use client";

import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useClipboard } from "@/hooks/use-clipboard";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  /**
   * The value to copy to clipboard
   */
  value: string;
  /**
   * Button size variant
   * @default "default"
   */
  size?: "sm" | "default" | "lg";
  /**
   * Callback when copy completes
   */
  onCopy?: () => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function CopyButton({
  value,
  size = "default",
  onCopy,
  className,
}: CopyButtonProps): React.ReactElement {
  const { copy, copied } = useClipboard();

  const handleCopy = async (): Promise<void> => {
    const success = await copy(value);
    if (success && onCopy) {
      onCopy();
    }
  };

  const iconSize = size === "sm" ? 14 : size === "lg" ? 20 : 16;

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size={size === "default" ? "icon" : size}
              onClick={(): void => void handleCopy()}
              className={cn("transition-colors", className)}
              aria-label={copied ? "Copied" : "Copy to clipboard"}
            >
              {copied ? (
                <Check className="text-green-500" size={iconSize} />
              ) : (
                <Copy size={iconSize} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{copied ? "Copied!" : "Copy to clipboard"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {/* ARIA live region for screen reader announcement */}
      <span aria-live="polite" aria-atomic="true" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </>
  );
}
