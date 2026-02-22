"use client";

import { useMemo } from "react";
import { JsonView, darkStyles, defaultStyles } from "react-json-view-lite";
import { useTheme } from "next-themes";
import { CopyButton } from "@/components/shared/copy-button";
import { cn } from "@/lib/utils";
import "react-json-view-lite/dist/index.css";

interface JsonTreeProps {
  /**
   * JSON data to display (can be string or parsed object)
   */
  data: unknown;
  /**
   * Initial expansion depth
   * @default 2
   */
  defaultExpandDepth?: number;
  /**
   * Whether to show copy button on hover
   * @default true
   */
  showCopyButton?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function JsonTree({
  data,
  defaultExpandDepth = 2,
  showCopyButton = true,
  className,
}: JsonTreeProps): React.ReactElement {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const parsedData = useMemo((): unknown => {
    if (typeof data === "string") {
      try {
        return JSON.parse(data) as unknown;
      } catch {
        return data;
      }
    }
    return data;
  }, [data]);

  const jsonString = useMemo((): string => {
    try {
      return JSON.stringify(parsedData, null, 2);
    } catch {
      return String(parsedData);
    }
  }, [parsedData]);

  // Custom styles to match our theme
  const customStyles = isDark
    ? {
        ...darkStyles,
        container: "bg-transparent",
        basicChildStyle: "pl-4",
        label: "text-purple-400 mr-2",
        nullValue: "text-gray-500",
        undefinedValue: "text-gray-500",
        stringValue: "text-green-400",
        booleanValue: "text-blue-400",
        numberValue: "text-yellow-400",
        otherValue: "text-gray-400",
        punctuation: "text-gray-500",
        collapseIcon: "text-gray-400 cursor-pointer",
        expandIcon: "text-gray-400 cursor-pointer",
        collapsedContent: "text-gray-500",
      }
    : {
        ...defaultStyles,
        container: "bg-transparent",
        basicChildStyle: "pl-4",
        label: "text-purple-600 mr-2",
        nullValue: "text-gray-500",
        undefinedValue: "text-gray-500",
        stringValue: "text-green-600",
        booleanValue: "text-blue-600",
        numberValue: "text-yellow-600",
        otherValue: "text-gray-600",
        punctuation: "text-gray-500",
        collapseIcon: "text-gray-600 cursor-pointer",
        expandIcon: "text-gray-600 cursor-pointer",
        collapsedContent: "text-gray-500",
      };

  return (
    <div
      className={cn("group relative", className)}
      role="tree"
      aria-label="JSON tree viewer"
    >
      {showCopyButton && (
        <div className="absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
          <CopyButton value={jsonString} size="sm" />
        </div>
      )}
      <div className="overflow-auto p-4 font-mono text-sm">
        <JsonView
          data={parsedData as object}
          shouldExpandNode={(level): boolean => level < defaultExpandDepth}
          style={customStyles}
        />
      </div>
    </div>
  );
}
