"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  ZoomIn,
  ZoomOut,
  Download,
  Undo,
  Redo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/display/loading-spinner";
import { cn } from "@/lib/utils";

interface ImageEditorProps {
  /**
   * Image source (URL or base64 data URI)
   */
  src: string;
  /**
   * Callback when image is edited
   */
  onSave?: (dataUrl: string) => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

interface Transform {
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  zoom: number;
  brightness: number;
  contrast: number;
  saturation: number;
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
}

const DEFAULT_TRANSFORM: Transform = {
  rotation: 0,
  flipX: false,
  flipY: false,
  zoom: 1,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  cropX: 0,
  cropY: 0,
  cropWidth: 100,
  cropHeight: 100,
};

export function ImageEditor({
  src,
  onSave,
  className,
}: ImageEditorProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [transform, setTransform] = useState<Transform>({
    ...DEFAULT_TRANSFORM,
  });
  const [history, setHistory] = useState<Transform[]>([
    { ...DEFAULT_TRANSFORM },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [activeTab, setActiveTab] = useState("transform");

  const isLoading = loadedSrc !== src;

  // Load image
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      imageRef.current = img;
      setImageDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
      setLoadedSrc(src);
    };
    img.onerror = () => {
      if (cancelled) return;
      setLoadedSrc(src);
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  // Render canvas
  useEffect(() => {
    if (!canvasRef.current || !imageRef.current || isLoading) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imageRef.current;

    // Calculate canvas size based on rotation
    const isRotated90 = transform.rotation === 90 || transform.rotation === 270;
    const canvasWidth = isRotated90 ? img.naturalHeight : img.naturalWidth;
    const canvasHeight = isRotated90 ? img.naturalWidth : img.naturalHeight;

    // Apply crop
    const cropWidth = (transform.cropWidth / 100) * canvasWidth;
    const cropHeight = (transform.cropHeight / 100) * canvasHeight;

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply filters
    ctx.filter = `brightness(${transform.brightness}%) contrast(${transform.contrast}%) saturate(${transform.saturation}%)`;

    // Save context state
    ctx.save();

    // Move to center of cropped area
    ctx.translate(canvas.width / 2, canvas.height / 2);

    // Apply transformations
    ctx.rotate((transform.rotation * Math.PI) / 180);
    ctx.scale(
      transform.flipX ? -transform.zoom : transform.zoom,
      transform.flipY ? -transform.zoom : transform.zoom
    );

    // Draw image centered
    // Adjust for rotation when drawing
    if (isRotated90) {
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    } else {
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    }

    ctx.restore();
  }, [transform, isLoading]);

  const updateTransform = useCallback(
    (updates: Partial<Transform>) => {
      const newTransform = { ...transform, ...updates };
      setTransform(newTransform);

      // Add to history (remove any forward history)
      const newHistory = [...history.slice(0, historyIndex + 1), newTransform];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [transform, history, historyIndex]
  );

  const undo = (): void => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setTransform(history[historyIndex - 1]!);
    }
  };

  const redo = (): void => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setTransform(history[historyIndex + 1]!);
    }
  };

  const reset = (): void => {
    setTransform({ ...DEFAULT_TRANSFORM });
    setHistory([{ ...DEFAULT_TRANSFORM }]);
    setHistoryIndex(0);
  };

  const rotateLeft = (): void =>
    updateTransform({ rotation: (transform.rotation - 90 + 360) % 360 });
  const rotateRight = (): void =>
    updateTransform({ rotation: (transform.rotation + 90) % 360 });
  const flipH = (): void => updateTransform({ flipX: !transform.flipX });
  const flipV = (): void => updateTransform({ flipY: !transform.flipY });

  const handleDownload = (): void => {
    if (!canvasRef.current) return;

    const link = document.createElement("a");
    link.download = "edited-image.png";
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();

    onSave?.(link.href);
  };

  const handleSave = (): void => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    onSave?.(dataUrl);
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={undo}
            disabled={historyIndex <= 0}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
          >
            <Redo className="h-4 w-4" />
          </Button>
          <div className="bg-border mx-1 h-4 w-px" />
          <Button variant="ghost" size="sm" onClick={reset}>
            Reset
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={handleSave}>
            Apply
          </Button>
          <Button size="sm" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      {/* Canvas preview */}
      <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-lg border bg-[#1a1a1a]">
        {isLoading ? (
          <LoadingSpinner label="Loading image..." />
        ) : (
          <canvas
            ref={canvasRef}
            className="max-h-[400px] max-w-full object-contain"
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
          />
        )}
      </div>

      {/* Edit controls */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transform">Transform</TabsTrigger>
          <TabsTrigger value="crop">Crop</TabsTrigger>
          <TabsTrigger value="adjust">Adjust</TabsTrigger>
        </TabsList>

        <TabsContent value="transform" className="space-y-4 pt-4">
          {/* Rotation */}
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={rotateLeft}>
              <RotateCcw className="mr-1 h-4 w-4" />
              -90°
            </Button>
            <Button variant="outline" size="sm" onClick={rotateRight}>
              <RotateCw className="mr-1 h-4 w-4" />
              +90°
            </Button>
            <div className="bg-border mx-2 h-4 w-px" />
            <Button
              variant={transform.flipX ? "default" : "outline"}
              size="sm"
              onClick={flipH}
            >
              <FlipHorizontal className="h-4 w-4" />
            </Button>
            <Button
              variant={transform.flipY ? "default" : "outline"}
              size="sm"
              onClick={flipV}
            >
              <FlipVertical className="h-4 w-4" />
            </Button>
          </div>

          {/* Zoom */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <ZoomIn className="h-4 w-4" />
              Zoom
            </Label>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  updateTransform({ zoom: Math.max(0.1, transform.zoom - 0.1) })
                }
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Slider
                value={[transform.zoom * 100]}
                onValueChange={([v]) => updateTransform({ zoom: v! / 100 })}
                min={10}
                max={300}
                step={5}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  updateTransform({ zoom: Math.min(3, transform.zoom + 0.1) })
                }
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <span className="w-14 text-right text-sm">
                {Math.round(transform.zoom * 100)}%
              </span>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="crop" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">X Position</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[transform.cropX]}
                  onValueChange={([v]) => updateTransform({ cropX: v })}
                  min={0}
                  max={100 - transform.cropWidth}
                  step={1}
                />
                <span className="w-12 text-right text-sm">
                  {transform.cropX}%
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Y Position</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[transform.cropY]}
                  onValueChange={([v]) => updateTransform({ cropY: v })}
                  min={0}
                  max={100 - transform.cropHeight}
                  step={1}
                />
                <span className="w-12 text-right text-sm">
                  {transform.cropY}%
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Width</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[transform.cropWidth]}
                  onValueChange={([v]) => updateTransform({ cropWidth: v })}
                  min={10}
                  max={100 - transform.cropX}
                  step={1}
                />
                <span className="w-12 text-right text-sm">
                  {transform.cropWidth}%
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Height</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[transform.cropHeight]}
                  onValueChange={([v]) => updateTransform({ cropHeight: v })}
                  min={10}
                  max={100 - transform.cropY}
                  step={1}
                />
                <span className="w-12 text-right text-sm">
                  {transform.cropHeight}%
                </span>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="adjust" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label className="text-sm">Brightness</Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[transform.brightness]}
                onValueChange={([v]) => updateTransform({ brightness: v })}
                min={0}
                max={200}
                step={1}
              />
              <span className="w-14 text-right text-sm">
                {transform.brightness}%
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Contrast</Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[transform.contrast]}
                onValueChange={([v]) => updateTransform({ contrast: v })}
                min={0}
                max={200}
                step={1}
              />
              <span className="w-14 text-right text-sm">
                {transform.contrast}%
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Saturation</Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[transform.saturation]}
                onValueChange={([v]) => updateTransform({ saturation: v })}
                min={0}
                max={200}
                step={1}
              />
              <span className="w-14 text-right text-sm">
                {transform.saturation}%
              </span>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Image info */}
      {!isLoading && imageDimensions.width > 0 && (
        <div className="text-muted-foreground text-center text-xs">
          Original: {imageDimensions.width} × {imageDimensions.height}px
        </div>
      )}
    </div>
  );
}
