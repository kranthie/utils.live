import type { ToolMeta } from "@utils-live/tools";
import { getToolCountLabel } from "@/lib/tools/get-tool";

/**
 * SoftwareApplication JSON-LD schema for tool pages.
 */
export interface SoftwareApplicationSchema {
  "@context": "https://schema.org";
  "@type": "SoftwareApplication";
  name: string;
  description: string;
  applicationCategory: "DeveloperApplication";
  operatingSystem: "Any";
  offers: {
    "@type": "Offer";
    price: "0";
    priceCurrency: "USD";
  };
  url?: string;
  screenshot?: string;
}

/**
 * BreadcrumbList JSON-LD schema.
 */
export interface BreadcrumbListSchema {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: BreadcrumbItem[];
}

/**
 * Single breadcrumb item.
 */
export interface BreadcrumbItem {
  "@type": "ListItem";
  position: number;
  name: string;
  item?: string;
}

/**
 * Website JSON-LD schema.
 */
export interface WebsiteSchema {
  "@context": "https://schema.org";
  "@type": "WebSite";
  name: string;
  description: string;
  url: string;
  potentialAction?: {
    "@type": "SearchAction";
    target: {
      "@type": "EntryPoint";
      urlTemplate: string;
    };
    "query-input": string;
  };
}

/**
 * Organization JSON-LD schema.
 */
export interface OrganizationSchema {
  "@context": "https://schema.org";
  "@type": "Organization";
  name: string;
  url: string;
  logo?: string;
  sameAs?: string[];
}

/**
 * FAQPage JSON-LD schema for tool pages.
 */
export interface FAQPageSchema {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: Array<{
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }>;
}

const BASE_URL = "https://utils.live";

/**
 * Generate SoftwareApplication JSON-LD for a tool.
 */
export function generateToolJsonLd(tool: ToolMeta): SoftwareApplicationSchema {
  const parts = tool.id.split("/");
  const category = parts[0] ?? "";
  const slug = parts[1] ?? "";

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description: tool.description,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    url: `${BASE_URL}/tools/${category}/${slug}`,
    screenshot: `${BASE_URL}/og/${category}/${slug}.png`,
  };
}

/**
 * Generate BreadcrumbList JSON-LD for a page.
 */
export function generateBreadcrumbJsonLd(
  items: Array<{ label: string; href?: string }>
): BreadcrumbListSchema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem" as const,
      position: index + 1,
      name: item.label,
      ...(item.href && { item: `${BASE_URL}${item.href}` }),
    })),
  };
}

/**
 * Generate Website JSON-LD with search action.
 */
export function generateWebsiteJsonLd(): WebsiteSchema {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "utils.live",
    description: `${getToolCountLabel()} free online developer tools. JSON formatters, encoders, converters, and more.`,
    url: BASE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/tools?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Generate Organization JSON-LD.
 */
export function generateOrganizationJsonLd(): OrganizationSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "utils.live",
    url: BASE_URL,
  };
}

/**
 * Generate a breadcrumb path for tool pages.
 */
export function getToolBreadcrumbs(
  category: string,
  categoryName: string,
  toolName: string
): Array<{ label: string; href?: string }> {
  return [
    { label: "Home", href: "/" },
    { label: "Tools", href: "/tools" },
    { label: categoryName, href: `/tools/${category}` },
    { label: toolName },
  ];
}

/**
 * Generate FAQPage JSON-LD for a tool page.
 */
export function generateToolFAQJsonLd(
  toolName: string,
  toolDescription: string,
  categoryName: string
): FAQPageSchema {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What is ${toolName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${toolName} is a free online tool that lets you ${toolDescription.toLowerCase().replace(/\.$/, "")}. It runs entirely in your browser, ensuring your data stays private and secure.`,
        },
      },
      {
        "@type": "Question",
        name: `Is ${toolName} free to use?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes, ${toolName} is completely free to use. No sign-up, no account, and no usage limits. It's part of utils.live's collection of free ${categoryName.toLowerCase()}.`,
        },
      },
      {
        "@type": "Question",
        name: `Is my data safe when using ${toolName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Absolutely. ${toolName} runs entirely in your browser using client-side JavaScript. No data is ever sent to our servers, making it completely private and secure.`,
        },
      },
    ],
  };
}

/**
 * ItemList JSON-LD schema for collection pages (category tool listings).
 */
export interface ItemListSchema {
  "@context": "https://schema.org";
  "@type": "ItemList";
  name: string;
  description: string;
  url: string;
  numberOfItems: number;
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    description: string;
    url: string;
  }>;
}

/**
 * Generate ItemList JSON-LD for a category page.
 */
export function generateCategoryItemListJsonLd(
  categoryId: string,
  categoryName: string,
  categoryDescription: string,
  tools: Array<{ id: string; name: string; description: string }>
): ItemListSchema {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Free Online ${categoryName}`,
    description: categoryDescription,
    url: `${BASE_URL}/tools/${categoryId}`,
    numberOfItems: tools.length,
    itemListElement: tools.slice(0, 20).map((tool, index) => {
      const parts = tool.id.split("/");
      return {
        "@type": "ListItem",
        position: index + 1,
        name: tool.name,
        description: tool.description,
        url: `${BASE_URL}/tools/${parts[0] ?? ""}/${parts[1] ?? ""}`,
      };
    }),
  };
}

/**
 * Generate a breadcrumb path for category pages.
 */
export function getCategoryBreadcrumbs(
  categoryName: string
): Array<{ label: string; href?: string }> {
  return [
    { label: "Home", href: "/" },
    { label: "Tools", href: "/tools" },
    { label: categoryName },
  ];
}
