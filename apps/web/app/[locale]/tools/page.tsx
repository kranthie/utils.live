import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import {
  getAllToolCards,
  getCategorySummaries,
  getToolCountLabel,
} from "@/lib/tools/get-tool";
import {
  generateBreadcrumbJsonLd,
  generateWebsiteJsonLd,
} from "@/lib/seo/json-ld";
import { JsonLdMultiple } from "@/components/seo/json-ld";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { ToolsPageClient } from "@/components/tools/tools-page-client";
import { buildAlternates } from "@/lib/alternates";

interface ToolsPageProps {
  params: Promise<{ locale: string }>;
}

const toolCountLabel = getToolCountLabel();

export async function generateMetadata({
  params,
}: ToolsPageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  return {
    title: "Explore Tools",
    description: `Browse ${toolCountLabel} free developer tools. JSON formatters, encoders, converters, hash generators, and more.`,
    openGraph: {
      title: "Explore Tools | utils.live",
      description: `Browse ${toolCountLabel} free developer tools. JSON formatters, encoders, converters, and more.`,
      type: "website",
      url: `https://utils.live/${locale}/tools/`,
    },
    alternates: buildAlternates(locale, "/tools/"),
  };
}

export default async function AllToolsPage({
  params,
}: ToolsPageProps): Promise<React.ReactElement> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("tools");

  const tools = getAllToolCards();
  const categories = getCategorySummaries();

  // Breadcrumbs
  const breadcrumbs = [
    { label: t("breadcrumbs.home"), href: "/" },
    { label: t("breadcrumbs.tools") },
  ];

  // JSON-LD data
  const jsonLdItems = [
    generateBreadcrumbJsonLd(breadcrumbs),
    generateWebsiteJsonLd(),
  ];

  // Tool data for client components
  const toolData = tools.map((tool) => ({
    id: tool.id,
    name: tool.name,
    description: tool.description,
    category: tool.category,
    icon: tool.icon,
    tier: tool.tier as "client",
  }));

  // Category name map for search result chips
  const categoryNames = Object.fromEntries(
    categories.map((c) => [c.id, c.name])
  );

  return (
    <>
      <JsonLdMultiple items={jsonLdItems} />

      <div className="flex flex-col gap-8">
        {/* Breadcrumb navigation */}
        <Breadcrumb items={breadcrumbs} includeJsonLd={false} />

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            {t("search.heading")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("search.subheading", { count: tools.length })}
          </p>
        </div>

        {/* Client-side tools browser with search */}
        <ToolsPageClient
          tools={toolData}
          categories={categories}
          categoryNames={categoryNames}
        />
      </div>
    </>
  );
}
