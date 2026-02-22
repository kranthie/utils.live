"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ToolTierValue } from "@utils-live/tools/constants";
import { ToolCard } from "@/components/tools/tool-card";
import { cn } from "@/lib/utils";

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: ToolTierValue;
}

interface FeaturedToolsProps {
  /**
   * Tools to display
   */
  tools: Tool[];
  /**
   * Section title
   * @default "Popular Tools"
   */
  title?: string;
  /**
   * Section description
   */
  description?: string;
  /**
   * Maximum number of tools to show
   * @default 6
   */
  maxTools?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function FeaturedTools({
  tools,
  title = "Featured Tools",
  description = "Get started with these essential developer utilities",
  maxTools = 6,
  className,
}: FeaturedToolsProps): React.ReactElement {
  const displayTools = tools.slice(0, maxTools);

  return (
    <section className={cn("py-16 sm:py-24", className)}>
      <div className="container">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <Link
            href="/tools"
            className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm font-medium"
          >
            View all tools
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </div>
    </section>
  );
}
