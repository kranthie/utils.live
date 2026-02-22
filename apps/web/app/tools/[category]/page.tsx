import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getToolsInCategory,
  getCategoryInfo,
  getCategorySummaries,
} from "@/lib/tools/get-tool";
import {
  getCategoryBreadcrumbs,
  generateBreadcrumbJsonLd,
} from "@/lib/seo/json-ld";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { CategoryToolsClient } from "@/components/tools/category-tools-client";
import { LucideIcon } from "@/components/shared/lucide-icon";

interface CategoryPageParams {
  category: string;
}

interface CategoryPageProps {
  params: Promise<CategoryPageParams>;
}

/**
 * Generate static params for all categories.
 */
export function generateStaticParams(): CategoryPageParams[] {
  const categories = getCategorySummaries();
  return categories.map((cat) => ({ category: cat.id }));
}

/**
 * Generate metadata for category pages.
 */
export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const categoryInfo = getCategoryInfo(category);

  if (!categoryInfo) {
    return {
      title: "Category Not Found",
      description: "The requested category could not be found.",
    };
  }

  return {
    title: `Free Online ${categoryInfo.name} - ${categoryInfo.toolCount} Tools`,
    description: categoryInfo.description,
    openGraph: {
      title: `Free Online ${categoryInfo.name} - ${categoryInfo.toolCount} Tools | utils.live`,
      description: categoryInfo.description,
      type: "website",
      url: `https://utils.live/tools/${category}`,
      images: [
        {
          url: `https://utils.live/og/${category}/index.png`,
          width: 1200,
          height: 630,
          alt: `${categoryInfo.name} - Free Online Tools`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `Free Online ${categoryInfo.name} - ${categoryInfo.toolCount} Tools | utils.live`,
      description: categoryInfo.description,
      images: [
        {
          url: `https://utils.live/og/${category}/index.png`,
          width: 1200,
          height: 630,
          alt: `${categoryInfo.name} - Free Online Tools`,
        },
      ],
    },
    alternates: {
      canonical: `https://utils.live/tools/${category}`,
    },
  };
}

export default async function CategoryPage({
  params,
}: CategoryPageProps): Promise<React.ReactElement> {
  const { category } = await params;

  const categoryInfo = getCategoryInfo(category);
  const tools = getToolsInCategory(category);

  if (!categoryInfo || tools.length === 0) {
    notFound();
  }

  // Generate breadcrumbs
  const breadcrumbs = getCategoryBreadcrumbs(categoryInfo.name);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbs);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />

      <div className="flex flex-col gap-8">
        {/* Breadcrumb navigation */}
        <Breadcrumb items={breadcrumbs} includeJsonLd={false} />

        {/* Category header */}
        <div className="flex items-start gap-4 sm:items-center">
          <div className="bg-muted flex h-14 w-14 shrink-0 items-center justify-center rounded-lg sm:h-16 sm:w-16">
            <LucideIcon
              name={categoryInfo.icon}
              className="h-7 w-7 sm:h-8 sm:w-8"
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold sm:text-3xl">
              {categoryInfo.name}
            </h1>
            <p className="text-muted-foreground mt-1 line-clamp-2">
              {categoryInfo.description}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {categoryInfo.toolCount} tools available
            </p>
          </div>
        </div>

        {/* Tools grid with search + subgroup filtering */}
        <CategoryToolsClient tools={tools} />
      </div>
    </>
  );
}
