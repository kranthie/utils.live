"use client";

import { useSyncExternalStore } from "react";
import { useKeyboard } from "@/components/providers/keyboard-provider";
import { SearchCommand } from "@/components/search/search-command";

interface SearchTool {
  id: string;
  name: string;
  description: string;
  category: string;
  keywords: string[];
  icon: string;
}

interface SearchCategory {
  id: string;
  name: string;
  icon: string;
}

interface GlobalSearchProps {
  tools: SearchTool[];
  categories: SearchCategory[];
}

export function GlobalSearch({
  tools,
  categories,
}: GlobalSearchProps): React.ReactElement | null {
  const { isSearchOpen, setSearchOpen } = useKeyboard();

  // Only render on client to avoid hydration issues
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) {
    return null;
  }

  return (
    <SearchCommand
      tools={tools}
      categories={categories}
      open={isSearchOpen}
      onOpenChange={setSearchOpen}
    />
  );
}
