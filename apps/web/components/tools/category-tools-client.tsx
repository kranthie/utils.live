"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { ToolCardMedium } from "./tool-card-medium";
import { cn } from "@/lib/utils";
import type { ToolTierValue } from "@utils-live/tools/constants";

interface ToolData {
  id: string;
  name: string;
  description: string;
  category: string;
  tier: ToolTierValue;
  icon: string;
  href: string;
  subgroup?: string;
}

interface CategoryToolsClientProps {
  tools: ToolData[];
}

export function CategoryToolsClient({
  tools,
}: CategoryToolsClientProps): React.ReactElement {
  const t = useTranslations("tools.browse");
  const [search, setSearch] = useState("");
  const [activeSubgroup, setActiveSubgroup] = useState<string | null>(null);

  const subgroups = useMemo(() => {
    const groups = new Map<string, number>();
    for (const tool of tools) {
      if (tool.subgroup) {
        groups.set(tool.subgroup, (groups.get(tool.subgroup) ?? 0) + 1);
      }
    }
    return Array.from(groups.entries()).map(([name, count]) => ({
      name,
      count,
    }));
  }, [tools]);

  const filtered = useMemo(() => {
    let result = tools;
    if (activeSubgroup) {
      result = result.filter((t) => t.subgroup === activeSubgroup);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [tools, search, activeSubgroup]);

  const isFiltering = search || activeSubgroup;
  const hasSubgroups = subgroups.length > 0;

  return (
    <section className="flex flex-col gap-4">
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
          placeholder={t("searchToolsInCategory")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Subgroup chips */}
      {hasSubgroups && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSubgroup(null)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              !activeSubgroup
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {t("all")}
            <span
              className={cn(
                "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs",
                !activeSubgroup
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-background text-muted-foreground"
              )}
            >
              {tools.length}
            </span>
          </button>
          {subgroups.map((sg) => (
            <button
              key={sg.name}
              onClick={() =>
                setActiveSubgroup(activeSubgroup === sg.name ? null : sg.name)
              }
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                activeSubgroup === sg.name
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {sg.name}
              <span
                className={cn(
                  "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs",
                  activeSubgroup === sg.name
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-background text-muted-foreground"
                )}
              >
                {sg.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Results count when filtering */}
      {isFiltering && (
        <p className="text-muted-foreground text-sm">
          {t("toolsFound", { count: filtered.length })}
        </p>
      )}

      {/* Tool grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((tool) => (
            <ToolCardMedium
              key={tool.id}
              tool={{
                id: tool.id,
                name: tool.name,
                description: tool.description,
                icon: tool.icon,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            {activeSubgroup ? t("noToolsFoundSubgroup") : t("noToolsFound")}
          </p>
        </div>
      )}
    </section>
  );
}
