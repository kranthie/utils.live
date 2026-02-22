import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  companyName: z.string().default("Company Name").describe("Company name"),
  websiteUrl: z.string().default("https://example.com").describe("Website URL"),
  type: z
    .enum([
      "general",
      "blog",
      "affiliate",
      "professional",
      "medical",
      "financial",
    ])
    .default("general")
    .describe("Disclaimer type"),
});
const outputSchema = z.object({
  output: z.string().describe("Generated disclaimer"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const base = `# Disclaimer\n\n**Website:** ${input.websiteUrl}\n**Company:** ${input.companyName}\n\n`;
  const footer = `\n\n---\n*This is a template. Consult a legal professional to ensure compliance with applicable laws.*`;
  const disclaimers: Record<string, string> = {
    general: `## General Disclaimer\n\nThe information provided on this website is for general informational purposes only. All information is provided in good faith; however, we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the website.\n\nUnder no circumstance shall we have any liability to you for any loss or damage incurred as a result of the use of the website or reliance on any information provided. Your use of the website and your reliance on any information is solely at your own risk.`,
    blog: `## Blog Disclaimer\n\nThe views and opinions expressed on this blog are purely those of the authors. Any product claim, statistic, quote, or other representation about a product or service should be verified with the manufacturer, provider, or party in question.\n\nThis blog does not provide professional advice. Readers should consult qualified professionals before acting on any information presented here.`,
    affiliate: `## Affiliate Disclaimer\n\nThis website may contain affiliate links. If you make a purchase through these links, we may earn a commission at no additional cost to you. We only recommend products and services we believe will be of value to our readers.\n\nThe affiliate relationships do not influence our editorial content. All opinions expressed are our own.`,
    professional: `## Professional Disclaimer\n\nThe information on this website is provided for general informational and educational purposes only and is not a substitute for professional advice. You should not act or refrain from acting on the basis of any content included on this website without seeking appropriate professional advice.`,
    medical: `## Medical Disclaimer\n\nThe content on this website is not intended to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.\n\nNever disregard professional medical advice or delay in seeking it because of something you have read on this website.`,
    financial: `## Financial Disclaimer\n\nThe information on this website is not intended as financial advice. We do not recommend any particular investment, security, transaction, or strategy. The content is provided for informational purposes only.\n\nPast performance is not indicative of future results. Investments involve risk, and you should consult a qualified financial advisor before making any financial decisions.`,
  };
  return {
    output: base + (disclaimers[input.type] ?? disclaimers.general) + footer,
  };
}

export const disclaimerGenerator = defineTool({
  meta: {
    id: "legal/disclaimer-generator",
    name: "Disclaimer Generator",
    description:
      "Free online disclaimer generator — create website disclaimers instantly in your browser. No data is stored. Supports general, blog, affiliate, professional, medical, and financial disclaimer templates.",
    category: "legal",
    tier: ToolTier.CLIENT,
    keywords: [
      "disclaimer",
      "legal",
      "template",
      "generator",
      "liability",
      "blog",
      "affiliate",
      "medical",
      "financial",
      "professional",
      "website",
    ],
    examples: [
      {
        title: "Financial disclaimer for investment blog",
        description:
          "Generate a financial disclaimer warning readers about investment risks",
        input: {
          companyName: "Acme Finance Blog",
          websiteUrl: "https://blog.example.com",
          type: "financial",
        },
        output:
          "# Disclaimer\n\n**Website:** https://blog.example.com\n**Company:** Acme Finance Blog\n\n## Financial Disclaimer",
      },
      {
        title: "Affiliate disclosure for product reviews",
        description:
          "Generate an affiliate disclaimer disclosing commission relationships",
        input: {
          companyName: "Acme Reviews",
          websiteUrl: "https://reviews.example.com",
          type: "affiliate",
        },
        output:
          "# Disclaimer\n\n**Website:** https://reviews.example.com\n**Company:** Acme Reviews\n\n## Affiliate Disclaimer",
      },
    ],
    ui: { outputLanguage: "markdown" },
  },
  inputSchema,
  outputSchema,
  execute,
});
