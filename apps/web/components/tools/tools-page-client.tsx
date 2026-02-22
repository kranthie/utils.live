"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PopularTools } from "@/components/tools/popular-tools";
import { RecentlyUsedTools } from "@/components/tools/recently-used-tools";
import { BrowseCategories } from "@/components/tools/browse-categories";
import { SearchResultsClient } from "@/components/tools/search-results-client";
import type { ToolTierValue } from "@utils-live/tools/constants";

interface ToolData {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  tier: ToolTierValue;
}

interface CategorySummary {
  id: string;
  name: string;
  description: string;
  icon: string;
  toolCount: number;
  href: string;
  group?: string;
}

interface ToolsPageClientProps {
  tools: ToolData[];
  categories: CategorySummary[];
  categoryNames: Record<string, string>;
}

function ToolsPageContent({
  tools,
  categories,
  categoryNames,
}: ToolsPageClientProps): React.ReactElement {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") ?? "";

  if (searchQuery) {
    const results = tools
      .filter((tool) => {
        const query = searchQuery.toLowerCase();
        return (
          tool.name.toLowerCase().includes(query) ||
          tool.description.toLowerCase().includes(query) ||
          tool.id.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return (
      <SearchResultsClient
        results={results}
        query={searchQuery}
        categoryNames={categoryNames}
      />
    );
  }

  return (
    <>
      <RecentlyUsedTools tools={tools} maxItems={6} />
      <PopularTools tools={tools} />
      <BrowseCategories categories={categories} />
    </>
  );
}

export function ToolsPageClient(
  props: ToolsPageClientProps
): React.ReactElement {
  return (
    <Suspense>
      <ToolsPageContent {...props} />
    </Suspense>
  );
}
