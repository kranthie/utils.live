"use client";

import { useState, useRef, useEffect } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize2,
  Minimize2,
  FlipHorizontal,
  FlipVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/shared/download-button";
import { cn } from "@/lib/utils";

interface ImagePreviewProps {
  /**
   * Image source (URL or base64 data URI)
   */
  src: string;
  /**
   * Image alt text
   */
  alt?: string;
  /**
   * File name for download
   */
  fileName?: string;
  /**
   * Whether to show the toolbar
   * @default true
   */
  showToolbar?: boolean;
  /**
   * Whether to enable pan/zoom interactions
   * @default true
   */
  interactive?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function ImagePreview({
  src,
  alt = "Preview",
  fileName = "image",
  showToolbar = true,
  interactive = true,
  className,
}: ImagePreviewProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageSize, setImageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // Load image to get dimensions
  useEffect(() => {
    const img = new Image();
    img.onload = (): void => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = src;
  }, [src]);

  const handleZoomIn = (): void => {
    setZoom((z) => Math.min(z + 0.25, 5));
  };

  const handleZoomOut = (): void => {
    setZoom((z) => Math.max(z - 0.25, 0.1));
  };

  const handleRotateLeft = (): void => {
    setRotation((r) => (r - 90) % 360);
  };

  const handleRotateRight = (): void => {
    setRotation((r) => (r + 90) % 360);
  };

  const handleFlipHorizontal = (): void => {
    setFlipX((f) => !f);
  };

  const handleFlipVertical = (): void => {
    setFlipY((f) => !f);
  };

  const handleReset = (): void => {
    setZoom(1);
    setRotation(0);
    setFlipX(false);
    setFlipY(false);
  };

  const toggleFullscreen = (): void => {
    setIsFullscreen(!isFullscreen);
  };

  // Build transform string
  const transform = [
    `scale(${zoom})`,
    `rotate(${rotation}deg)`,
    flipX ? "scaleX(-1)" : "",
    flipY ? "scaleY(-1)" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Determine file extension from src
  const getFileExtension = (): string => {
    if (src.startsWith("data:image/")) {
      const match = src.match(/data:image\/([^;]+)/);
      return match ? match[1]! : "png";
    }
    const match = src.match(/\.([^.]+)$/);
    return match ? match[1]! : "png";
  };

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-md border bg-[#1a1a1a]",
        isFullscreen && "fixed inset-4 z-50",
        className
      )}
    >
      {/* Toolbar */}
      {showToolbar && (
        <div className="bg-muted flex items-center justify-between border-b px-3 py-2">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <span>{Math.round(zoom * 100)}%</span>
            {imageSize && (
              <span>
                • {imageSize.width} × {imageSize.height}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {interactive && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.1}
                  aria-label="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 5}
                  aria-label="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <div className="bg-border mx-1 h-4 w-px" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRotateLeft}
                  aria-label="Rotate left"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRotateRight}
                  aria-label="Rotate right"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <div className="bg-border mx-1 h-4 w-px" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFlipHorizontal}
                  aria-label="Flip horizontal"
                  className={flipX ? "bg-accent" : ""}
                >
                  <FlipHorizontal className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFlipVertical}
                  aria-label="Flip vertical"
                  className={flipY ? "bg-accent" : ""}
                >
                  <FlipVertical className="h-4 w-4" />
                </Button>
                <div className="bg-border mx-1 h-4 w-px" />
              </>
            )}
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Reset
            </Button>
            <DownloadButton
              content={src}
              filename={`${fileName}.${getFileExtension()}`}
              size="sm"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Image container */}
      <div
        ref={containerRef}
        className="flex min-h-[200px] flex-1 items-center justify-center overflow-auto p-4"
        style={{
          // Checkerboard pattern for transparency
          backgroundImage: `
            linear-gradient(45deg, #2a2a2a 25%, transparent 25%),
            linear-gradient(-45deg, #2a2a2a 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #2a2a2a 75%),
            linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)
          `,
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
        }}
      >
        <img
          src={src}
          alt={alt}
          className="max-h-full max-w-full object-contain transition-transform duration-200"
          style={{ transform }}
          draggable={false}
        />
      </div>
    </div>
  );
}
