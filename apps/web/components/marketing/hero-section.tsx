"use client";

import Link from "next/link";
import { Github, Search } from "lucide-react";
import { KeyboardShortcut } from "@/components/shared/keyboard-shortcut";
import { useKeyboard } from "@/components/providers/keyboard-provider";
import { cn } from "@/lib/utils";
import { CodeRain } from "@/components/effects/code-rain";

interface HeroSectionProps {
  toolCountLabel: string;
  categories?: Array<{ id: string; name: string }>;
  onSearchClick?: () => void;
  className?: string;
}

const DEFAULT_CATEGORIES = [
  { id: "json", name: "JSON" },
  { id: "encoding", name: "Encoding" },
  { id: "text", name: "Text" },
  { id: "crypto", name: "Crypto" },
  { id: "jwt", name: "JWT" },
  { id: "regex", name: "Regex" },
  { id: "color", name: "Color" },
  { id: "datetime", name: "Date & Time" },
];

export function HeroSection({
  toolCountLabel,
  categories = DEFAULT_CATEGORIES,
  onSearchClick,
  className,
}: HeroSectionProps): React.ReactElement {
  const { setSearchOpen } = useKeyboard();

  const handleSearchClick = onSearchClick ?? (() => setSearchOpen(true));

  return (
    <section
      className={cn(
        "relative flex flex-col items-center justify-center py-10 text-center sm:py-12 lg:py-16",
        className
      )}
    >
      <CodeRain className="pointer-events-none absolute inset-0 z-0" />

      <div className="relative z-10 flex max-w-3xl flex-col items-center gap-5 px-4">
        {/* Open Source badge */}
        <a
          href="https://github.com/kranthie/utils.live"
          target="_blank"
          rel="noopener noreferrer"
          className="border-border/60 text-muted-foreground hover:text-foreground hover:border-border inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors"
        >
          <Github className="h-3.5 w-3.5" />
          Free &amp; Open Source
        </a>

        {/* Headline */}
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(to bottom right, var(--color-foreground), color-mix(in srgb, var(--color-foreground) 70%, transparent))",
            }}
          >
            Developer utilities, instantly
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-muted-foreground max-w-2xl text-lg sm:text-xl">
          JSON formatters, encoders, converters, hash generators, and more. Free
          tools that run entirely in your browser.
        </p>

        {/* Search bar (fake — opens command palette on click) */}
        <button
          type="button"
          onClick={handleSearchClick}
          aria-label="Search developer tools"
          className={cn(
            "group mt-2 flex w-full max-w-xl items-center gap-3",
            "h-13 rounded-xl border px-4 sm:h-14 sm:px-5",
            "bg-card/60 border-border hover:border-brand/40",
            "text-muted-foreground transition-all duration-200",
            "hover:ring-brand/20 hover:ring-2",
            "cursor-pointer"
          )}
        >
          <Search className="text-muted-foreground/60 group-hover:text-brand h-5 w-5 shrink-0 transition-colors" />
          <span className="flex-1 text-left text-sm sm:text-base">
            Search {toolCountLabel} developer tools...
          </span>
          <KeyboardShortcut keys={["meta", "k"]} size="sm" />
        </button>

        {/* Category quick-links */}
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/tools/${category.id}`}
              className={cn(
                "inline-flex items-center justify-center rounded-full px-3 py-1 text-sm",
                "bg-muted/50 text-muted-foreground",
                "hover:bg-muted hover:text-foreground",
                "transition-colors duration-150"
              )}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
