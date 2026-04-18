"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HtmlPreviewProps {
  /**
   * HTML content to render
   */
  content: string;
  /**
   * Whether to sandbox the iframe
   * @default true
   */
  sandboxed?: boolean;
  /**
   * Whether the sandbox permits script execution and form submission.
   * Turn off for tools that generate static content (SVG, meta tags, etc.)
   * so that any sanitizer bypass can't escalate to script execution or
   * external form posts.
   * @default false
   */
  allowScripts?: boolean;
  /**
   * Whether to show the toolbar
   * @default true
   */
  showToolbar?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function HtmlPreview({
  content,
  sandboxed = true,
  allowScripts = false,
  showToolbar = true,
  className,
}: HtmlPreviewProps): React.ReactElement {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [key, setKey] = useState(0);

  // Build srcdoc content
  const srcdocContent = useMemo(() => {
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 16px;
        font-family: system-ui, -apple-system, sans-serif;
        line-height: 1.5;
      }
      img { max-width: 100%; height: auto; }
    </style>
  </head>
  <body>
    ${content}
  </body>
</html>`;
  }, [content]);

  const handleRefresh = (): void => {
    setKey((k) => k + 1);
  };

  const toggleFullscreen = (): void => {
    setIsFullscreen(!isFullscreen);
  };

  // Build sandbox attribute - same-origin permission is intentionally excluded.
  // Script/form execution is opt-in; static-content tools default to the
  // minimal permissions (popups only) so a sanitizer bypass can't pivot.
  const sandboxValue = sandboxed
    ? allowScripts
      ? "allow-scripts allow-popups allow-forms"
      : "allow-popups"
    : undefined;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-md border",
        isFullscreen && "bg-background fixed inset-4 z-50",
        className
      )}
    >
      {/* Toolbar */}
      {showToolbar && (
        <div className="bg-muted flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-medium">HTML Preview</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              aria-label="Refresh preview"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
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

      {/* Preview iframe */}
      <div className="min-h-[200px] flex-1 bg-white">
        <iframe
          key={key}
          title="HTML Preview"
          sandbox={sandboxValue}
          srcDoc={srcdocContent}
          className="h-full min-h-[200px] w-full border-0"
          style={{ colorScheme: "light" }}
        />
      </div>
    </div>
  );
}
