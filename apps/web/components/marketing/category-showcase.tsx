"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { LucideIcon } from "@/components/shared/lucide-icon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fadeInUp, staggerContainer, VIEWPORT_ONCE } from "@/lib/animation";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  toolCount: number;
  href: string;
}

interface CategoryShowcaseProps {
  /**
   * Categories to display
   */
  categories: Category[];
  /**
   * Section title
   * @default "Browse by Category"
   */
  title?: string;
  /**
   * Maximum number of categories to show
   * @default 8
   */
  maxCategories?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function CategoryShowcase({
  categories,
  title = "Browse by Category",
  maxCategories = 8,
  className,
}: CategoryShowcaseProps): React.ReactElement {
  const displayCategories = categories.slice(0, maxCategories);

  return (
    <section className={cn("py-12 sm:py-16", className)}>
      <div className="container">
        <p className="text-brand mb-3 text-center text-xs font-semibold tracking-widest uppercase">
          Categories
        </p>
        <h2 className="mb-3 text-center text-2xl font-bold sm:text-3xl">
          {title}
        </h2>
        <p className="text-muted-foreground mb-8 text-center text-lg">
          Find the right tool for any task
        </p>

        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
        >
          {displayCategories.map((category) => (
            <motion.div key={category.id} variants={fadeInUp}>
              <Link href={category.href}>
                <Card className="group bg-card/80 hover:bg-card hover:ring-brand/20 h-full border-transparent shadow-sm transition-all hover:shadow-md hover:ring-1">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-110">
                        <LucideIcon name={category.icon} className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="group-hover:text-primary text-lg">
                          {category.name}
                        </CardTitle>
                        <p className="text-muted-foreground text-xs">
                          {category.toolCount} tools
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-2">
                      {category.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-8 flex items-center justify-center gap-6">
          <Link
            href="/tools"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm font-medium transition-colors"
          >
            View all tools
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/tools#categories"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm font-medium transition-colors"
          >
            View all categories
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
