"use client";

import { useEffect, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { ZoomIn, ZoomOut, RotateCcw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/display/loading-spinner";
import { ErrorDisplay } from "@/components/display/error-display";
import { cn } from "@/lib/utils";

interface MermaidRendererProps {
  /**
   * Mermaid diagram definition
   */
  content: string;
  /**
   * Theme for the diagram
   * @default "default"
   */
  theme?: "default" | "dark" | "forest" | "neutral";
  /**
   * Whether to show zoom controls
   * @default true
   */
  showControls?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

// Track last initialized theme to avoid unnecessary mermaid.initialize() calls
let lastInitializedTheme: string | null = null;

export function MermaidRenderer({
  content,
  theme = "default",
  showControls = true,
  className,
}: MermaidRendererProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    let mounted = true;

    const renderDiagram = async (): Promise<void> => {
      if (!content.trim()) {
        setSvg("");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Dynamically import mermaid to reduce initial bundle size
        const mermaid = (await import("mermaid")).default;

        // Only re-initialize when theme changes (not on every content change)
        if (lastInitializedTheme !== theme) {
          mermaid.initialize({
            startOnLoad: false,
            theme,
            securityLevel: "strict",
            fontFamily: "inherit",
          });
          lastInitializedTheme = theme;
        }

        // Generate unique ID for this render
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`;

        const { svg: renderedSvg } = await mermaid.render(id, content);

        if (mounted) {
          const sanitizedSvg = DOMPurify.sanitize(renderedSvg, {
            USE_PROFILES: { svg: true, svgFilters: true },
          });
          setSvg(sanitizedSvg);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error ? err.message : "Failed to render diagram"
          );
          setSvg("");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void renderDiagram();

    return (): void => {
      mounted = false;
    };
  }, [content, theme]);

  const handleZoomIn = (): void => {
    setZoom((z) => Math.min(z + 0.25, 3));
  };

  const handleZoomOut = (): void => {
    setZoom((z) => Math.max(z - 0.25, 0.25));
  };

  const handleReset = (): void => {
    setZoom(1);
  };

  const handleDownload = (): void => {
    if (!svg) return;

    // Create SVG blob and download
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diagram.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex min-h-[200px] items-center justify-center",
          className
        )}
      >
        <LoadingSpinner size="default" label="Rendering diagram..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("p-4", className)}>
        <ErrorDisplay title="Diagram Error" message={error} />
      </div>
    );
  }

  if (!svg) {
    return (
      <div
        className={cn(
          "text-muted-foreground flex min-h-[200px] items-center justify-center",
          className
        )}
      >
        No diagram to display
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Controls */}
      {showControls && (
        <div className="bg-muted flex items-center justify-between border-b px-3 py-2">
          <span className="text-muted-foreground text-sm">
            {Math.round(zoom * 100)}%
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 0.25}
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              aria-label="Reset zoom"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <div className="bg-border mx-1 h-4 w-px" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              aria-label="Download SVG"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Diagram */}
      <div
        ref={containerRef}
        className="bg-background overflow-auto p-4"
        style={{ maxHeight: "500px" }}
      >
        <div
          className="inline-block origin-top-left transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
          role="img"
          aria-label="Mermaid diagram"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </div>
  );
}
