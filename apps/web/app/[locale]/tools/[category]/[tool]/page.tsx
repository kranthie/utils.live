import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  setRequestLocale,
  getMessages,
  getTranslations,
} from "next-intl/server";
import type { AbstractIntlMessages } from "next-intl";
import {
  getTool,
  getRelatedTools,
  getCategoryInfo,
  getAllToolCards,
} from "@/lib/tools/get-tool";
import { generateToolJsonLd, generateToolFAQJsonLd } from "@/lib/seo/json-ld";
import { getToolSeoDescription } from "@/lib/seo/description-helper";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { LucideIcon } from "@/components/shared/lucide-icon";
import { ToolPageClient } from "./tool-page-client";
import { buildAlternates } from "@/lib/alternates";

interface ToolPageParams {
  locale: string;
  category: string;
  tool: string;
}

interface ToolPageProps {
  params: Promise<ToolPageParams>;
}

/**
 * Generate static params for all tools.
 * This pre-renders all 1400+ tool pages at build time.
 */
export function generateStaticParams(): Array<{
  category: string;
  tool: string;
}> {
  const tools = getAllToolCards();

  return tools.map((tool) => {
    const parts = tool.id.split("/");
    return { category: parts[0] ?? "", tool: parts[1] ?? "" };
  });
}

/**
 * Generate metadata for tool pages.
 */
export async function generateMetadata({
  params,
}: ToolPageProps): Promise<Metadata> {
  const { locale, category, tool: toolSlug } = await params;
  setRequestLocale(locale);
  const toolData = getTool(category, toolSlug);

  if (!toolData) {
    return {
      title: "Tool Not Found",
      description: "The requested tool could not be found.",
    };
  }

  const { meta } = toolData;
  const categoryInfo = getCategoryInfo(category);

  // Use localized tool name/description from messages (fallback to meta)
  const messages = await getMessages();
  const categoryMessages = (
    messages.toolMeta as AbstractIntlMessages | undefined
  )?.[category] as Record<string, Record<string, string>> | undefined;
  const toolMessages = categoryMessages?.[toolSlug];
  const localizedMeta = {
    ...meta,
    name: toolMessages?.name ?? meta.name,
    description: toolMessages?.description ?? meta.description,
  };
  const seoDescription = getToolSeoDescription(
    localizedMeta,
    categoryInfo?.name ?? category
  );

  const localizedName = localizedMeta.name;

  return {
    title: `${localizedName} Online - Free ${categoryInfo?.name ?? category}`,
    description: seoDescription,
    keywords: meta.keywords,
    openGraph: {
      title: `${localizedName} Online - Free ${categoryInfo?.name ?? category} | utils.live`,
      description: seoDescription,
      type: "website",
      url: `https://utils.live/tools/${category}/${toolSlug}`,
      images: [
        {
          url: "https://utils.live/og/default.png",
          width: 1200,
          height: 630,
          alt: `${localizedName} - Free Online Tool`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${localizedName} Online - Free ${categoryInfo?.name ?? category} | utils.live`,
      description: seoDescription,
      images: [
        {
          url: "https://utils.live/og/default.png",
          width: 1200,
          height: 630,
          alt: `${localizedName} - Free Online Tool`,
        },
      ],
    },
    alternates: buildAlternates(locale, `/tools/${category}/${toolSlug}/`),
  };
}

export default async function ToolPage({
  params,
}: ToolPageProps): Promise<React.ReactElement> {
  const { locale, category, tool: toolSlug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("tools");
  const toolData = getTool(category, toolSlug);

  if (!toolData) {
    notFound();
  }

  const { meta, ui, inputSchema, optionsSchema, outputSchema, examples } =
    toolData;

  // Resolve localized tool name/description from messages (fallback to meta)
  const messages = await getMessages();
  const categoryMessages = (
    messages.toolMeta as AbstractIntlMessages | undefined
  )?.[category] as Record<string, Record<string, string>> | undefined;
  const toolMessages = categoryMessages?.[toolSlug];
  const toolName = toolMessages?.name ?? meta.name;
  const toolDescription = toolMessages?.description ?? meta.description;

  // Get related tools with localized names
  const relatedToolsRaw = getRelatedTools(meta.id);
  const relatedTools = relatedToolsRaw.map((rt) => {
    const [rtCat, rtSlug] = rt.id.split("/");
    const rtMessages = (
      messages.toolMeta as
        | Record<string, Record<string, Record<string, string>>>
        | undefined
    )?.[rtCat ?? ""]?.[rtSlug ?? ""];
    return {
      ...rt,
      name: rtMessages?.name ?? rt.name,
      description: rtMessages?.description ?? rt.description,
    };
  });
  const categoryInfo = getCategoryInfo(category);
  const categoryMetaMessages = messages.categoryMeta as
    | Record<string, Record<string, string>>
    | undefined;
  const localizedCategoryName =
    categoryMetaMessages?.[category]?.name ?? categoryInfo?.name ?? category;

  // Generate breadcrumbs with translated labels
  const breadcrumbs = [
    { label: t("breadcrumbs.home"), href: "/" },
    { label: t("breadcrumbs.tools"), href: "/tools" },
    { label: localizedCategoryName, href: `/tools/${category}` },
    { label: toolName },
  ];

  // Generate JSON-LD
  const jsonLd = generateToolJsonLd(meta);
  const faqJsonLd = generateToolFAQJsonLd(
    toolName,
    toolDescription,
    localizedCategoryName
  );

  return (
    <>
      <JsonLd data={jsonLd} />
      <JsonLd data={faqJsonLd} />

      <div className="flex flex-col gap-6">
        {/* Breadcrumb navigation */}
        <Breadcrumb items={breadcrumbs} />

        {/* Tool header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-lg">
              <LucideIcon
                name={categoryInfo?.icon ?? "FileCode2"}
                className="h-6 w-6"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{toolName}</h1>
              <p className="text-muted-foreground">{toolDescription}</p>
            </div>
          </div>
        </div>

        {/* Tool interface (client component) */}
        <ToolPageClient
          tool={meta}
          ui={ui}
          inputSchema={inputSchema}
          optionsSchema={optionsSchema}
          outputSchema={outputSchema}
          relatedTools={relatedTools}
          examples={examples}
        />
      </div>
    </>
  );
}
