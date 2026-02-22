"use client";

import { useState, useMemo } from "react";
import { ToolCard } from "@/components/tools/tool-card";
import { cn } from "@/lib/utils";
import type { ToolTierValue } from "@utils-live/tools/constants";

interface SearchToolData {
  id: string;
  name: string;
  description: string;
  category: string;
  tier: ToolTierValue;
  icon: string;
}

interface SearchResultsClientProps {
  results: SearchToolData[];
  query: string;
  /** Map of category ID to display name, e.g. { json: "JSON Tools", crypto: "Cryptography" } */
  categoryNames: Record<string, string>;
}

export function SearchResultsClient({
  results,
  query,
  categoryNames,
}: SearchResultsClientProps): React.ReactElement {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categoryChips = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tool of results) {
      counts.set(tool.category, (counts.get(tool.category) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([id, count]) => ({ id, name: categoryNames[id] ?? id, count }))
      .sort((a, b) => b.count - a.count);
  }, [results, categoryNames]);

  const filtered = activeCategory
    ? results.filter((t) => t.category === activeCategory)
    : results;

  const activeCategoryName = activeCategory
    ? (categoryNames[activeCategory] ?? activeCategory)
    : null;

  return (
    <section>
      {/* Header */}
      <h2 className="mb-4 text-lg font-semibold">
        {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;
        {query}&rdquo;
        {activeCategoryName ? ` in ${activeCategoryName}` : ""}
      </h2>

      {/* Category filter chips */}
      {categoryChips.length >= 2 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              !activeCategory
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            All
            <span
              className={cn(
                "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs",
                !activeCategory
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-background text-muted-foreground"
              )}
            >
              {results.length}
            </span>
          </button>
          {categoryChips.map((chip) => (
            <button
              key={chip.id}
              onClick={() =>
                setActiveCategory(activeCategory === chip.id ? null : chip.id)
              }
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                activeCategory === chip.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {chip.name}
              <span
                className={cn(
                  "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs",
                  activeCategory === chip.id
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-background text-muted-foreground"
                )}
              >
                {chip.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Results grid or empty state */}
      {filtered.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No tools found matching &quot;{query}&quot;. Try a different search
          term.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      )}
    </section>
  );
}
