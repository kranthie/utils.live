"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Clock, Star, ArrowRight } from "lucide-react";
import { LucideIcon } from "@/components/shared/lucide-icon";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useDebounce } from "@/hooks/use-debounce";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import { searchTools } from "@/lib/tool-search";

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  keywords: string[];
  icon: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface SearchCommandProps {
  /**
   * All available tools
   */
  tools: Tool[];
  /**
   * All categories
   */
  categories: Category[];
  /**
   * Whether the dialog is open
   */
  open: boolean;
  /**
   * Callback when open state changes
   */
  onOpenChange: (open: boolean) => void;
  /**
   * Callback when a tool is selected
   */
  onSelect?: (tool: Tool) => void;
  /**
   * Callback when a category is selected
   */
  onCategorySelect?: (category: Category) => void;
}

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

export function SearchCommand({
  tools,
  categories,
  open,
  onOpenChange,
  onSelect,
  onCategorySelect,
}: SearchCommandProps): React.ReactElement {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 150);
  const [recentTools, setRecentTools] = useLocalStorage<string[]>(
    "utils.live:recent-tools",
    []
  );

  // Register global keyboard shortcut
  useKeyboardShortcut(["meta", "k"], (): void => {
    onOpenChange(true);
  });

  // Escape to close
  useKeyboardShortcut(
    ["Escape"],
    (): void => {
      if (open) onOpenChange(false);
    },
    { enabled: open }
  );

  const searchResults = useMemo(() => {
    if (!debouncedQuery) return [];
    return searchTools(tools, debouncedQuery, { limit: 10 });
  }, [tools, debouncedQuery]);

  const recentToolObjects = useMemo(() => {
    return recentTools
      .map((id) => tools.find((t) => t.id === id))
      .filter((t): t is Tool => t !== undefined)
      .slice(0, 5);
  }, [recentTools, tools]);

  const popularToolObjects = useMemo(() => {
    return POPULAR_TOOL_IDS.map((id) => tools.find((t) => t.id === id)).filter(
      (t): t is Tool => t !== undefined
    );
  }, [tools]);

  const handleToolSelect = useCallback(
    (tool: Tool): void => {
      // Add to recent tools
      setRecentTools((prev) => {
        const filtered = prev.filter((id) => id !== tool.id);
        return [tool.id, ...filtered].slice(0, 10);
      });

      onSelect?.(tool);
      router.push(`/tools/${tool.id}`);
      onOpenChange(false);
      setQuery("");
    },
    [router, onOpenChange, onSelect, setRecentTools]
  );

  const handleCategorySelect = useCallback(
    (category: Category): void => {
      onCategorySelect?.(category);
      router.push(`/tools/${category.id}`);
      onOpenChange(false);
      setQuery("");
    },
    [router, onOpenChange, onCategorySelect]
  );

  // Reset query when dialog closes
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setQuery("");
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      <CommandInput
        placeholder="Search tools..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No tools found.</CommandEmpty>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <CommandGroup heading="Results">
            {searchResults.map((result) => (
              <CommandItem
                key={result.tool.id}
                value={result.tool.id}
                onSelect={(): void => handleToolSelect(result.tool)}
              >
                <Search className="text-muted-foreground mr-2 h-4 w-4" />
                <div className="flex flex-1 flex-col">
                  <span>{result.tool.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {result.tool.description}
                  </span>
                </div>
                <ArrowRight className="ml-2 h-4 w-4 opacity-50" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Recent Tools (when no query) */}
        {!query && recentToolObjects.length > 0 && (
          <CommandGroup heading="Recent">
            {recentToolObjects.map((tool) => (
              <CommandItem
                key={tool.id}
                value={tool.id}
                onSelect={(): void => handleToolSelect(tool)}
              >
                <Clock className="text-muted-foreground mr-2 h-4 w-4" />
                <span>{tool.name}</span>
                <ArrowRight className="ml-auto h-4 w-4 opacity-50" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Popular Tools (when no query) */}
        {!query && popularToolObjects.length > 0 && (
          <>
            {recentToolObjects.length > 0 && <CommandSeparator />}
            <CommandGroup heading="Popular">
              {popularToolObjects.map((tool) => (
                <CommandItem
                  key={`popular-${tool.id}`}
                  value={`popular-${tool.id}`}
                  onSelect={(): void => handleToolSelect(tool)}
                >
                  <Star className="text-muted-foreground mr-2 h-4 w-4" />
                  <div className="flex flex-1 flex-col">
                    <span>{tool.name}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {tool.description}
                    </span>
                  </div>
                  <ArrowRight className="ml-2 h-4 w-4 opacity-50" />
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Categories (when no query) */}
        {!query && categories.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Categories">
              {categories.map((category) => (
                <CommandItem
                  key={category.id}
                  value={`category-${category.id}`}
                  onSelect={(): void => handleCategorySelect(category)}
                >
                  <LucideIcon name={category.icon} className="mr-2 h-5 w-5" />
                  <span>{category.name}</span>
                  <ArrowRight className="ml-auto h-4 w-4 opacity-50" />
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
