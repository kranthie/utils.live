import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  setRequestLocale,
  getTranslations,
  getMessages,
} from "next-intl/server";
import {
  getToolsInCategory,
  getCategoryInfo,
  getCategorySummaries,
} from "@/lib/tools/get-tool";
import {
  getCategoryBreadcrumbs,
  generateBreadcrumbJsonLd,
  generateCategoryItemListJsonLd,
} from "@/lib/seo/json-ld";
import { JsonLdMultiple } from "@/components/seo/json-ld";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { CategoryToolsClient } from "@/components/tools/category-tools-client";
import { LucideIcon } from "@/components/shared/lucide-icon";
import { buildAlternates } from "@/lib/alternates";

interface CategoryPageParams {
  locale: string;
  category: string;
}

interface CategoryPageProps {
  params: Promise<CategoryPageParams>;
}

/**
 * Generate static params for all categories.
 */
export function generateStaticParams(): Array<{ category: string }> {
  const categories = getCategorySummaries();
  return categories.map((cat) => ({ category: cat.id }));
}

/**
 * Generate metadata for category pages.
 */
export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { locale, category } = await params;
  setRequestLocale(locale);
  const categoryInfo = getCategoryInfo(category);

  if (!categoryInfo) {
    return {
      title: "Category Not Found",
      description: "The requested category could not be found.",
    };
  }

  // Extract keyword phrases from category description (first sentence words)
  const descWords = categoryInfo.description
    .split(/[.,]/)[0]
    ?.toLowerCase()
    .replace(/free online /g, "")
    .trim();

  const keywords = [
    categoryInfo.name.toLowerCase(),
    `free online ${categoryInfo.name.toLowerCase()}`,
    `${categoryInfo.name.toLowerCase()} online`,
    ...(descWords ? [descWords] : []),
  ];

  return {
    title: `Free Online ${categoryInfo.name} - ${categoryInfo.toolCount} Tools`,
    description: categoryInfo.description,
    keywords,
    openGraph: {
      title: `Free Online ${categoryInfo.name} - ${categoryInfo.toolCount} Tools | utils.live`,
      description: categoryInfo.description,
      type: "website",
      url: `https://utils.live/tools/${category}`,
      images: [
        {
          url: "https://utils.live/og/default.png",
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
          url: "https://utils.live/og/default.png",
          width: 1200,
          height: 630,
          alt: `${categoryInfo.name} - Free Online Tools`,
        },
      ],
    },
    alternates: buildAlternates(locale, `/tools/${category}/`),
  };
}

export default async function CategoryPage({
  params,
}: CategoryPageProps): Promise<React.ReactElement> {
  const { locale, category } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("tools");

  const categoryInfo = getCategoryInfo(category);
  const tools = getToolsInCategory(category);

  if (!categoryInfo || tools.length === 0) {
    notFound();
  }

  // Resolve localized names from messages
  const messages = await getMessages();
  const categoryMetaMessages = messages.categoryMeta as
    | Record<string, Record<string, string>>
    | undefined;
  const toolMetaMessages = messages.toolMeta as
    | Record<string, Record<string, Record<string, string>>>
    | undefined;

  const localizedCategoryName =
    categoryMetaMessages?.[category]?.name ?? categoryInfo.name;
  const localizedCategoryDesc =
    categoryMetaMessages?.[category]?.description ?? categoryInfo.description;

  // Translate tool names for client component
  const localizedTools = tools.map((tool) => {
    const slug = tool.id.split("/")[1] ?? "";
    const toolMsg = toolMetaMessages?.[category]?.[slug];
    return {
      ...tool,
      name: toolMsg?.name ?? tool.name,
      description: toolMsg?.description ?? tool.description,
    };
  });

  // Generate breadcrumbs
  const breadcrumbs = getCategoryBreadcrumbs(localizedCategoryName);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbs);
  const itemListJsonLd = generateCategoryItemListJsonLd(
    category,
    categoryInfo.name,
    categoryInfo.description,
    tools
  );

  return (
    <>
      <JsonLdMultiple items={[breadcrumbJsonLd, itemListJsonLd]} />

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
              {localizedCategoryName}
            </h1>
            <p className="text-muted-foreground mt-1 line-clamp-2">
              {localizedCategoryDesc}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("categories.toolsAvailable", {
                count: categoryInfo.toolCount,
              })}
            </p>
          </div>
        </div>

        {/* Tools grid with search + subgroup filtering */}
        <CategoryToolsClient tools={localizedTools} />
      </div>
    </>
  );
}
