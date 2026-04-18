"use client";

import { Link } from "@/i18n/navigation";
import { Search, Terminal } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { KeyboardShortcut } from "@/components/shared/keyboard-shortcut";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useKeyboard } from "@/components/providers/keyboard-provider";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onSearchClick?: () => void;
  className?: string;
}

export function Header({
  onSearchClick,
  className,
}: HeaderProps): React.ReactElement {
  const t = useTranslations("header");
  const tBrand = useTranslations("common.brand");
  const { setSearchOpen } = useKeyboard();
  const handleSearchClick = onSearchClick ?? (() => setSearchOpen(true));

  return (
    <header
      className={cn(
        "bg-background/60 sticky top-0 z-50 w-full backdrop-blur-xl",
        className
      )}
    >
      <div className="container flex h-14 items-center justify-between px-4 sm:h-16 sm:px-6">
        {/* Left: Mobile nav + Logo + Nav links */}
        <div className="flex items-center gap-4">
          <MobileNav onSearch={handleSearchClick} />

          <Link
            href="/"
            className="flex items-center gap-2"
            aria-label={tBrand("homeAriaLabel")}
          >
            <Terminal className="text-brand h-6 w-6" aria-hidden="true" />
            <span className="hidden text-lg font-bold sm:inline-block sm:text-xl">
              utils.live
            </span>
          </Link>
        </div>

        {/* Right: Search + GitHub + Theme */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-muted-foreground hidden w-48 items-center justify-start gap-2 md:flex lg:w-64"
            onClick={handleSearchClick}
            aria-label={t("searchAriaLabel")}
            aria-haspopup="dialog"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 truncate text-left">
              {t("searchToolsPlaceholder")}
            </span>
            <KeyboardShortcut
              keys={["meta", "k"]}
              size="sm"
              className="hidden lg:flex"
            />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 touch-manipulation md:hidden"
            onClick={handleSearchClick}
            aria-label={t("searchMobileAriaLabel")}
            aria-haspopup="dialog"
          >
            <Search className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="sm" asChild>
            <a
              href="https://github.com/kranthie/utils.live"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("githubAriaLabel")}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
          </Button>
          <ThemeToggle size="sm" />
        </div>
      </div>
    </header>
  );
}
