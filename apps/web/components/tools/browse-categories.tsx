"use client";

import { useState, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LucideIcon } from "@/components/shared/lucide-icon";
import { cn } from "@/lib/utils";

interface CategoryData {
  id: string;
  name: string;
  description: string;
  icon: string;
  toolCount: number;
  href: string;
  group?: string;
}

interface BrowseCategoriesProps {
  categories: CategoryData[];
}

export function BrowseCategories({
  categories,
}: BrowseCategoriesProps): React.ReactElement {
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  // Derive groups from categories
  const groups = useMemo(() => {
    const counts = new Map<string, number>();
    for (const cat of categories) {
      if (cat.group) {
        counts.set(cat.group, (counts.get(cat.group) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [categories]);

  // Filter categories by search + group
  const filtered = useMemo(() => {
    let result = categories;
    if (activeGroup) {
      result = result.filter((c) => c.group === activeGroup);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [categories, search, activeGroup]);

  const isFiltering = search || activeGroup;
  const hasGroups = groups.length > 0;

  return (
    <section id="categories" className="flex scroll-mt-20 flex-col gap-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <LayoutGrid className="text-muted-foreground h-5 w-5" />
        Browse by Category
      </h2>

      {/* Search */}
      <div className="relative">
        <svg
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <Input
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Group filter chips */}
      {hasGroups && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveGroup(null)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              !activeGroup
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            All
            <span
              className={cn(
                "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs",
                !activeGroup
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-background text-muted-foreground"
              )}
            >
              {categories.length}
            </span>
          </button>
          {groups.map((g) => (
            <button
              key={g.name}
              onClick={() =>
                setActiveGroup(activeGroup === g.name ? null : g.name)
              }
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                activeGroup === g.name
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {g.name}
              <span
                className={cn(
                  "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs",
                  activeGroup === g.name
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-background text-muted-foreground"
                )}
              >
                {g.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Results count when filtering */}
      {isFiltering && (
        <p className="text-muted-foreground text-sm">
          {filtered.length} categor{filtered.length !== 1 ? "ies" : "y"} found
        </p>
      )}

      {/* Category grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((category) => (
            <Link
              key={category.id}
              href={category.href}
              className="hover:border-primary/50 hover:bg-muted/50 group flex h-full min-h-[120px] flex-col rounded-lg border p-4 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
                  <LucideIcon name={category.icon} className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="group-hover:text-primary font-semibold">
                    {category.name}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {category.toolCount} tools
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground mt-3 line-clamp-2 flex-1 text-sm">
                {category.description}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            No categories found. Try a different search term
            {activeGroup ? " or group" : ""}.
          </p>
        </div>
      )}
    </section>
  );
}
