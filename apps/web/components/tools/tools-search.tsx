"use client";

import { useState, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ToolsSearchProps {
  /**
   * Placeholder text for the search input
   * @default "Search tools..."
   */
  placeholder?: string;
  /**
   * Initial search query value
   */
  defaultValue?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function ToolsSearch({
  placeholder = "Search tools...",
  defaultValue = "",
  className,
}: ToolsSearchProps): React.ReactElement {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        router.push(`/tools?q=${encodeURIComponent(query.trim())}`);
      }
    },
    [query, router]
  );

  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)}>
      <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <Input
        type="search"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-9"
      />
    </form>
  );
}
