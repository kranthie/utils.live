import type { Metadata } from "next";
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

const toolCountLabel = getToolCountLabel();

export const metadata: Metadata = {
  title: "Explore Tools",
  description: `Browse ${toolCountLabel} free developer tools. JSON formatters, encoders, converters, hash generators, and more.`,
  openGraph: {
    title: "Explore Tools | utils.live",
    description: `Browse ${toolCountLabel} free developer tools. JSON formatters, encoders, converters, and more.`,
    type: "website",
    url: "https://utils.live/tools",
  },
  alternates: {
    canonical: "https://utils.live/tools",
  },
};

export default function AllToolsPage(): React.ReactElement {
  const tools = getAllToolCards();
  const categories = getCategorySummaries();

  // Breadcrumbs
  const breadcrumbs = [{ label: "Home", href: "/" }, { label: "Tools" }];

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
          <h1 className="text-2xl font-bold sm:text-3xl">Explore Tools</h1>
          <p className="text-muted-foreground mt-1">
            {tools.length} free developer tools at your fingertips
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
