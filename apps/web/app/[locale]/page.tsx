import type { Metadata } from "next";
import {
  getCategorySummaries,
  getToolCountLabel,
  getRoundedToolCount,
} from "@/lib/tools/get-tool";
import {
  generateWebsiteJsonLd,
  generateOrganizationJsonLd,
} from "@/lib/seo/json-ld";
import { JsonLdMultiple } from "@/components/seo/json-ld";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/marketing/hero-section";
import { ToolDemo } from "@/components/marketing/tool-demo";
import { CategoryShowcase } from "@/components/marketing/category-showcase";
import { FeatureCards } from "@/components/marketing/feature-cards";
import { CTASection } from "@/components/marketing/cta-section";

const toolCountLabel = getToolCountLabel();

export const metadata: Metadata = {
  title: "utils.live | Free Developer Tools & Utilities",
  description: `${toolCountLabel} free developer tools in one place. JSON formatters, encoders, converters, hash generators, and more. Fast, free, and privacy-focused.`,
  alternates: {
    canonical: "https://utils.live",
  },
};

export default function HomePage(): React.ReactElement {
  const categories = getCategorySummaries();

  // Format categories for the showcase
  const showcaseCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    icon: c.icon,
    toolCount: c.toolCount,
    href: c.href,
  }));

  // JSON-LD structured data for home page
  const jsonLdItems = [generateWebsiteJsonLd(), generateOrganizationJsonLd()];

  return (
    <div className="flex min-h-screen flex-col">
      <JsonLdMultiple items={jsonLdItems} />
      <Header />

      <main id="main-content" className="flex-1">
        <HeroSection toolCountLabel={toolCountLabel} />
        <ToolDemo toolCount={getRoundedToolCount()} />
        <CategoryShowcase
          categories={showcaseCategories}
          className="bg-muted/30 border-y"
        />
        <FeatureCards toolCountLabel={toolCountLabel} />
        <CTASection
          toolCount={getRoundedToolCount()}
          categoryCount={categories.length}
        />
      </main>

      <Footer />
    </div>
  );
}
