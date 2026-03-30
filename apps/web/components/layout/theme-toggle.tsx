"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ThemeToggleProps {
  /**
   * Size variant
   * @default "default"
   */
  size?: "sm" | "default" | "lg";
}

export function ThemeToggle({
  size = "default",
}: ThemeToggleProps): React.ReactElement {
  const { theme, resolvedTheme, setTheme } = useTheme();

  // Avoid hydration mismatch
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const iconSize = {
    sm: "h-4 w-4",
    default: "h-5 w-5",
    lg: "h-6 w-6",
  };

  // Show placeholder during SSR
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size={size === "default" ? "icon" : size}
        aria-label="Toggle theme"
      >
        <Monitor className={iconSize[size]} />
      </Button>
    );
  }

  // Determine which icon to show based on selected theme
  const renderIcon = (): React.ReactElement => {
    if (theme === "system") {
      return <Monitor className={iconSize[size]} />;
    }
    if (resolvedTheme === "dark") {
      return <Moon className={iconSize[size]} />;
    }
    return <Sun className={iconSize[size]} />;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size === "default" ? "icon" : size}
          aria-label="Toggle theme"
        >
          {renderIcon()}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          aria-current={theme === "light" ? "true" : undefined}
        >
          <Sun className="mr-2 h-4 w-4" />
          <span className="flex-1">Light</span>
          {theme === "light" && (
            <Check className="ml-2 h-4 w-4" aria-hidden="true" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          aria-current={theme === "dark" ? "true" : undefined}
        >
          <Moon className="mr-2 h-4 w-4" />
          <span className="flex-1">Dark</span>
          {theme === "dark" && (
            <Check className="ml-2 h-4 w-4" aria-hidden="true" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          aria-current={theme === "system" ? "true" : undefined}
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span className="flex-1">System</span>
          {theme === "system" && (
            <Check className="ml-2 h-4 w-4" aria-hidden="true" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
