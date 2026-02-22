"use client";

import { useState, useMemo } from "react";
import { Star } from "lucide-react";
import { ToolCardMedium } from "./tool-card-medium";
import { cn } from "@/lib/utils";

const POPULAR_TOOL_IDS = [
  "json/formatter",
  "encoding/base64-encode",
  "diagram/qr-code-generator",
  "diagram/mermaid-editor",
  "jwt/jwt-decoder",
  "crypto/sha256-hash",
  "color/hex-to-rgb",
  "text/case-converter",
  "regex/regex-tester",
  "datetime/unix-timestamp",
  "encoding/url-encode",
  "identifiers/uuid-v4-generator",
];

const FEATURED_TOOL_IDS = [
  "json/formatter",
  "encoding/base64-encode",
  "jwt/jwt-decoder",
  "crypto/sha256-hash",
  "regex/regex-tester",
  "identifiers/uuid-v4-generator",
  "text/case-converter",
  "diagram/mermaid-editor",
];

type Tab = "featured" | "popular";

interface PopularToolsProps {
  tools: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    tier: "client" | "server-light" | "server-heavy" | "ai";
  }>;
  className?: string;
}

export function PopularTools({
  tools,
  className,
}: PopularToolsProps): React.ReactElement | null {
  const [activeTab, setActiveTab] = useState<Tab>("featured");

  const toolMap = useMemo(() => {
    const map = new Map<string, (typeof tools)[number]>();
    for (const tool of tools) {
      map.set(tool.id, tool);
    }
    return map;
  }, [tools]);

  const featuredTools = useMemo(
    () =>
      FEATURED_TOOL_IDS.map((id) => toolMap.get(id)).filter(
        (t): t is NonNullable<typeof t> => t != null
      ),
    [toolMap]
  );

  const popularTools = useMemo(
    () =>
      POPULAR_TOOL_IDS.map((id) => toolMap.get(id)).filter(
        (t): t is NonNullable<typeof t> => t != null
      ),
    [toolMap]
  );

  const displayedTools =
    activeTab === "featured" ? featuredTools : popularTools;

  if (displayedTools.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Star className="text-muted-foreground h-5 w-5" />
          Top Picks
        </h2>
        <div className="bg-muted/50 flex items-center gap-1 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("featured")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              activeTab === "featured"
                ? "bg-muted text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Featured
          </button>
          <button
            onClick={() => setActiveTab("popular")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              activeTab === "popular"
                ? "bg-muted text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Popular
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {displayedTools.map((tool) => (
          <ToolCardMedium key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  );
}
