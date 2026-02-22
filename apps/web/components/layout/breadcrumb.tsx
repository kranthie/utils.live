"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { JsonLd } from "@/components/seo/json-ld";
import { generateBreadcrumbJsonLd } from "@/lib/seo/json-ld";

interface BreadcrumbItem {
  label: string;
  href?: string; // Last item typically has no href
}

interface BreadcrumbProps {
  /**
   * Breadcrumb items from root to current page
   */
  items: BreadcrumbItem[];
  /**
   * Separator between items
   * @default "/"
   */
  separator?: ReactNode;
  /**
   * Whether to show home icon for first item
   * @default true
   */
  showHomeIcon?: boolean;
  /**
   * Whether to include JSON-LD structured data
   * @default true
   */
  includeJsonLd?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function Breadcrumb({
  items,
  separator,
  showHomeIcon = true,
  includeJsonLd = true,
  className,
}: BreadcrumbProps): React.ReactElement {
  const SeparatorElement = separator ?? (
    <ChevronRight className="text-muted-foreground h-4 w-4" />
  );

  // Generate JSON-LD data
  const jsonLdData = includeJsonLd ? generateBreadcrumbJsonLd(items) : null;

  return (
    <>
      {jsonLdData && <JsonLd data={jsonLdData} />}
      <nav
        className={cn("flex items-center text-sm", className)}
        aria-label="Breadcrumb"
      >
        <ol className="flex items-center gap-1.5">
          {items.map((item, index) => {
            const isFirst = index === 0;
            const isLast = index === items.length - 1;

            return (
              <li key={item.label} className="flex items-center gap-1.5">
                {!isFirst && (
                  <span className="text-muted-foreground" aria-hidden="true">
                    {SeparatorElement}
                  </span>
                )}
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className={cn(
                      "text-muted-foreground hover:text-foreground transition-colors",
                      "flex items-center gap-1"
                    )}
                  >
                    {isFirst && showHomeIcon && (
                      <Home className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <span
                    className={cn(
                      "flex items-center gap-1",
                      isLast
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    )}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {isFirst && showHomeIcon && (
                      <Home className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span>{item.label}</span>
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
