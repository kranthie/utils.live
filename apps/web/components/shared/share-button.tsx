"use client";

import { useState } from "react";
import { Share2, Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useClipboard } from "@/hooks/use-clipboard";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  /**
   * The URL to share
   */
  url: string;
  /**
   * The title for sharing
   */
  title?: string;
  /**
   * The description for sharing
   */
  description?: string;
  /**
   * Button size variant
   * @default "default"
   */
  size?: "sm" | "default" | "lg";
  /**
   * Callback when share completes
   */
  onShare?: () => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function ShareButton({
  url,
  title = "utils.live",
  description,
  size = "default",
  onShare,
  className,
}: ShareButtonProps): React.ReactElement {
  const [shared, setShared] = useState(false);
  const { copy, copied } = useClipboard();

  const handleNativeShare = async (): Promise<void> => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
        setShared(true);
        onShare?.();
        setTimeout(() => setShared(false), 2000);
      } catch (err) {
        // User cancelled or error - ignore
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
    }
  };

  const handleCopyLink = async (): Promise<void> => {
    await copy(url);
    onShare?.();
  };

  const iconSize = size === "sm" ? 14 : size === "lg" ? 20 : 16;

  // Use native share if available
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function"
  ) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={size === "default" ? "icon" : size}
              onClick={(): void => void handleNativeShare()}
              className={cn("transition-colors", className)}
              aria-label="Share"
            >
              {shared ? (
                <Check className="text-green-500" size={iconSize} />
              ) : (
                <Share2 size={iconSize} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{shared ? "Shared!" : "Share"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Fallback to dropdown with copy link
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size === "default" ? "icon" : size}
          className={cn("transition-colors", className)}
          aria-label="Share"
        >
          {copied ? (
            <Check className="text-green-500" size={iconSize} />
          ) : (
            <Share2 size={iconSize} />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={(): void => void handleCopyLink()}>
          <Link2 className="mr-2 h-4 w-4" />
          <span>Copy link</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
