"use client";

import { Link } from "@/i18n/navigation";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("home.hero");
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
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          {t("openSourceBadge")}
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
            {t("headline")}
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-muted-foreground max-w-2xl text-lg sm:text-xl">
          {t("subheadline")}
        </p>

        {/* Search bar (fake — opens command palette on click) */}
        <button
          type="button"
          onClick={handleSearchClick}
          aria-label={t("searchAriaLabel")}
          aria-haspopup="dialog"
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
            {t("searchPlaceholder", { toolCountLabel })}
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
