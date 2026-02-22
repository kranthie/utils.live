"use client";

import { useState } from "react";
import { Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface DownloadButtonProps {
  /**
   * The content to download
   */
  content: string | Blob;
  /**
   * The filename for the download
   */
  filename: string;
  /**
   * The MIME type for the content
   * @default "text/plain"
   */
  mimeType?: string;
  /**
   * Button size variant
   * @default "default"
   */
  size?: "sm" | "default" | "lg";
  /**
   * Callback when download starts
   */
  onDownload?: () => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function DownloadButton({
  content,
  filename,
  mimeType = "text/plain",
  size = "default",
  onDownload,
  className,
}: DownloadButtonProps): React.ReactElement {
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = (): void => {
    const blob =
      content instanceof Blob
        ? content
        : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloaded(true);
    onDownload?.();

    setTimeout(() => {
      setDownloaded(false);
    }, 2000);
  };

  const iconSize = size === "sm" ? 14 : size === "lg" ? 20 : 16;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size={size === "default" ? "icon" : size}
            onClick={handleDownload}
            className={cn("transition-colors", className)}
            aria-label={downloaded ? "Downloaded" : "Download"}
          >
            {downloaded ? (
              <Check className="text-green-500" size={iconSize} />
            ) : (
              <Download size={iconSize} />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{downloaded ? "Downloaded!" : `Download as ${filename}`}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
