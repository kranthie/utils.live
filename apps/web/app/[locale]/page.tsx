import type { Metadata } from "next";
import { setRequestLocale, getMessages } from "next-intl/server";
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
import { MotionProvider } from "@/components/providers/motion-provider";
import { buildAlternates } from "@/lib/alternates";

const toolCountLabel = getToolCountLabel();

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  return {
    title: "utils.live | Free Developer Tools & Utilities",
    description: `${toolCountLabel} free developer tools in one place. JSON formatters, encoders, converters, hash generators, and more. Fast, free, and privacy-focused.`,
    alternates: buildAlternates(locale, "/"),
  };
}

export default async function HomePage({
  params,
}: HomePageProps): Promise<React.ReactElement> {
  const { locale } = await params;
  setRequestLocale(locale);

  const categories = getCategorySummaries();

  // Resolve localized category names from messages
  const messages = await getMessages();
  const categoryMetaMessages = messages.categoryMeta as
    | Record<string, Record<string, string>>
    | undefined;

  // Format categories for the showcase with localized names
  const showcaseCategories = categories.map((c) => ({
    id: c.id,
    name: categoryMetaMessages?.[c.id]?.name ?? c.name,
    description: categoryMetaMessages?.[c.id]?.description ?? c.description,
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
        <MotionProvider>
          <HeroSection
            toolCountLabel={toolCountLabel}
            categories={[
              "json",
              "encoding",
              "text",
              "crypto",
              "jwt",
              "regex",
              "color",
              "datetime",
            ].map((id) => ({
              id,
              name:
                categoryMetaMessages?.[id]?.name ??
                categories.find((c) => c.id === id)?.name ??
                id,
            }))}
          />
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
        </MotionProvider>
      </main>

      <Footer />
    </div>
  );
}
