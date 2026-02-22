"use client";

import Link from "next/link";
import { Github, Search, Terminal } from "lucide-react";
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
            aria-label="utils.live home"
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
            aria-label="Search tools"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 truncate text-left">Search tools...</span>
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
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="sm" asChild>
            <a
              href="https://github.com/kranthie/utils.live"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View on GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
          </Button>
          <ThemeToggle size="sm" />
        </div>
      </div>
    </header>
  );
}
