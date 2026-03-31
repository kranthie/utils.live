import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import {
  getTool,
  getRelatedTools,
  getCategoryInfo,
  getAllToolCards,
} from "@/lib/tools/get-tool";
import {
  getToolBreadcrumbs,
  generateToolJsonLd,
  generateToolFAQJsonLd,
} from "@/lib/seo/json-ld";
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
  const toolData = getTool(category, toolSlug);

  if (!toolData) {
    return {
      title: "Tool Not Found",
      description: "The requested tool could not be found.",
    };
  }

  const { meta } = toolData;
  const categoryInfo = getCategoryInfo(category);
  const seoDescription = getToolSeoDescription(
    meta,
    categoryInfo?.name ?? category
  );

  return {
    title: `${meta.name} Online - Free ${categoryInfo?.name ?? category}`,
    description: seoDescription,
    keywords: meta.keywords,
    openGraph: {
      title: `${meta.name} Online - Free ${categoryInfo?.name ?? category} | utils.live`,
      description: seoDescription,
      type: "website",
      url: `https://utils.live/tools/${category}/${toolSlug}`,
      images: [
        {
          url: "https://utils.live/og/default.png",
          width: 1200,
          height: 630,
          alt: `${meta.name} - Free Online Tool`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${meta.name} Online - Free ${categoryInfo?.name ?? category} | utils.live`,
      description: seoDescription,
      images: [
        {
          url: "https://utils.live/og/default.png",
          width: 1200,
          height: 630,
          alt: `${meta.name} - Free Online Tool`,
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
  const toolData = getTool(category, toolSlug);

  if (!toolData) {
    notFound();
  }

  const { meta, ui, inputSchema, optionsSchema, outputSchema, examples } =
    toolData;

  // Get related tools and category info
  const relatedTools = getRelatedTools(meta.id);
  const categoryInfo = getCategoryInfo(category);

  // Generate breadcrumbs
  const breadcrumbs = getToolBreadcrumbs(
    category,
    categoryInfo?.name ?? category,
    meta.name
  );

  // Generate JSON-LD
  const jsonLd = generateToolJsonLd(meta);
  const faqJsonLd = generateToolFAQJsonLd(
    meta.name,
    meta.description,
    categoryInfo?.name ?? category
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
              <h1 className="text-2xl font-bold">{meta.name}</h1>
              <p className="text-muted-foreground">{meta.description}</p>
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
