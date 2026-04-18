"use client";

import { Link } from "@/i18n/navigation";
import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
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
  title,
  maxCategories = 8,
  className,
}: CategoryShowcaseProps): React.ReactElement {
  const t = useTranslations("home.categoryShowcase");
  const displayCategories = categories.slice(0, maxCategories);
  const displayTitle = title ?? t("heading");

  return (
    <section className={cn("py-12 sm:py-16", className)}>
      <div className="container">
        <p className="text-brand mb-3 text-center text-xs font-semibold tracking-widest uppercase">
          {t("eyebrow")}
        </p>
        <h2 className="mb-3 text-center text-2xl font-bold sm:text-3xl">
          {displayTitle}
        </h2>
        <p className="text-muted-foreground mb-8 text-center text-lg">
          {t("subheading")}
        </p>

        <m.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
        >
          {displayCategories.map((category) => (
            <m.div key={category.id} variants={fadeInUp}>
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
                          {t("toolsCount", { count: category.toolCount })}
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
            </m.div>
          ))}
        </m.div>

        <div className="mt-8 flex items-center justify-center gap-6">
          <Link
            href="/tools"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm font-medium transition-colors"
          >
            {t("viewAllTools")}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/tools#categories"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm font-medium transition-colors"
          >
            {t("viewAllCategories")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
