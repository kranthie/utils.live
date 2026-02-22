"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LucideIcon } from "@/components/shared/lucide-icon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface CategoryCardProps {
  /**
   * Category metadata
   */
  category: Category;
  /**
   * Number of tools in this category
   */
  toolCount: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function CategoryCard({
  category,
  toolCount,
  className,
}: CategoryCardProps): React.ReactElement {
  return (
    <Link href={`/tools/${category.id}`}>
      <Card
        className={cn(
          "hover:border-primary/50 group h-full transition-colors",
          className
        )}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-xl">
              <LucideIcon name={category.icon} className="h-7 w-7" />
            </div>
            <ArrowRight className="text-muted-foreground h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <CardTitle className="mt-4 text-xl">{category.name}</CardTitle>
          <CardDescription className="line-clamp-2">
            {category.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            <span className="text-foreground font-medium">{toolCount}</span>{" "}
            tools
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
