"use client";

import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
}

interface SearchResult {
  tool: Tool;
  matchType: "name" | "description" | "keyword";
  matchScore: number;
}

interface SearchResultsProps {
  /**
   * Search results to display
   */
  results: SearchResult[];
  /**
   * Query string for highlighting
   */
  query: string;
  /**
   * Whether results are loading
   */
  isLoading?: boolean;
  /**
   * Callback when a result is selected
   */
  onSelect?: (tool: Tool) => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query) return text;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-yellow-200 px-0.5 dark:bg-yellow-900">
        {text.slice(index, index + query.length)}
      </mark>
      {text.slice(index + query.length)}
    </>
  );
}

export function SearchResults({
  results,
  query,
  isLoading = false,
  onSelect,
  className,
}: SearchResultsProps): React.ReactElement {
  if (isLoading) {
    return (
      <div className={cn("space-y-2 p-4", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-muted/50 flex animate-pulse items-center gap-3 rounded-lg p-3"
          >
            <div className="bg-muted h-10 w-10 rounded" />
            <div className="flex-1 space-y-2">
              <div className="bg-muted h-4 w-1/3 rounded" />
              <div className="bg-muted h-3 w-2/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={cn("p-8 text-center", className)}>
        <Search className="text-muted-foreground/30 mx-auto mb-4 h-12 w-12" />
        <p className="text-muted-foreground">
          {query ? `No results for "${query}"` : "Start typing to search"}
        </p>
      </div>
    );
  }

  return (
    <div
      role="listbox"
      aria-label="Search results"
      className={cn("space-y-1", className)}
    >
      {results.map((result) => (
        <Link
          key={result.tool.id}
          href={`/tools/${result.tool.id}`}
          onClick={() => onSelect?.(result.tool)}
          role="option"
          aria-selected={false}
          className={cn(
            "flex items-center gap-3 rounded-lg p-3",
            "hover:bg-accent transition-colors",
            "group"
          )}
        >
          <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg text-xl">
            {result.tool.icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">
              {highlightText(result.tool.name, query)}
            </p>
            <p className="text-muted-foreground truncate text-sm">
              {highlightText(result.tool.description, query)}
            </p>
          </div>
          <ArrowRight className="text-muted-foreground h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>
      ))}
    </div>
  );
}
