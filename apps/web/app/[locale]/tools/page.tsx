import type { Metadata } from "next";
import {
  setRequestLocale,
  getTranslations,
  getMessages,
} from "next-intl/server";
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

  // Resolve localized tool/category names from messages
  const messages = await getMessages();
  const toolMetaMessages = messages.toolMeta as
    | Record<string, Record<string, Record<string, string>>>
    | undefined;
  const categoryMetaMessages = messages.categoryMeta as
    | Record<string, Record<string, string>>
    | undefined;

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

  // Tool data for client components — with localized names
  const toolData = tools.map((tool) => {
    const [cat, slug] = tool.id.split("/");
    const toolMsg = toolMetaMessages?.[cat ?? ""]?.[slug ?? ""];
    return {
      id: tool.id,
      name: toolMsg?.name ?? tool.name,
      description: toolMsg?.description ?? tool.description,
      category: tool.category,
      icon: tool.icon,
      tier: tool.tier as "client",
    };
  });

  // Category name map for search result chips — with localized names
  const categoryNames = Object.fromEntries(
    categories.map((c) => [c.id, categoryMetaMessages?.[c.id]?.name ?? c.name])
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
          categories={categories.map((c) => {
            const groupMessages = messages.categoryGroups as
              | Record<string, string>
              | undefined;
            return {
              ...c,
              name: categoryMetaMessages?.[c.id]?.name ?? c.name,
              description:
                categoryMetaMessages?.[c.id]?.description ?? c.description,
              group: c.group
                ? (groupMessages?.[c.group] ?? c.group)
                : undefined,
            };
          })}
          categoryNames={categoryNames}
        />
      </div>
    </>
  );
}
