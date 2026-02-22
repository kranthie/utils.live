import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  companyName: z
    .string()
    .default("Company Name")
    .describe("Company or website name"),
  websiteUrl: z.string().default("https://example.com").describe("Website URL"),
  email: z.string().default("privacy@example.com").describe("Contact email"),
  effectiveDate: z.string().default("2025-01-01").describe("Effective date"),
  collectsPersonalData: z
    .boolean()
    .default(true)
    .describe("Collects personal data"),
  usesCookies: z.boolean().default(true).describe("Uses cookies"),
  usesAnalytics: z.boolean().default(true).describe("Uses analytics"),
  hasNewsletter: z.boolean().default(false).describe("Has newsletter signup"),
});
const outputSchema = z.object({
  output: z.string().describe("Generated privacy policy"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const lines: string[] = [];
  lines.push(`# Privacy Policy\n`);
  lines.push(`**Effective Date:** ${input.effectiveDate}\n`);
  lines.push(
    `This privacy policy describes how ${input.companyName} ("we", "us", or "our") collects, uses, and protects your information when you visit ${input.websiteUrl} ("the Website").\n`
  );
  lines.push(`## Information We Collect\n`);
  if (input.collectsPersonalData) {
    lines.push(`We may collect the following personal information:\n`);
    lines.push(`- Name and email address`);
    lines.push(`- IP address and browser information`);
    lines.push(`- Usage data and interaction patterns\n`);
  }
  if (input.usesCookies) {
    lines.push(`## Cookies\n`);
    lines.push(
      `We use cookies and similar tracking technologies to track activity on our Website. Cookies are files with a small amount of data which may include an anonymous unique identifier. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.\n`
    );
  }
  if (input.usesAnalytics) {
    lines.push(`## Analytics\n`);
    lines.push(
      `We use third-party analytics services to help us understand how our users interact with the Website. These services may collect information about your use of the Website.\n`
    );
  }
  lines.push(`## How We Use Your Information\n`);
  lines.push(`We use the collected information for the following purposes:\n`);
  lines.push(`- To provide and maintain our Website`);
  lines.push(`- To improve our Website and user experience`);
  lines.push(`- To communicate with you about updates or changes`);
  if (input.hasNewsletter)
    lines.push(
      `- To send you newsletters and promotional materials (with your consent)`
    );
  lines.push(`- To comply with legal obligations\n`);
  lines.push(`## Data Security\n`);
  lines.push(
    `We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.\n`
  );
  lines.push(`## Your Rights\n`);
  lines.push(`You have the right to:\n`);
  lines.push(`- Access the personal data we hold about you`);
  lines.push(`- Request correction of inaccurate data`);
  lines.push(`- Request deletion of your personal data`);
  lines.push(`- Object to processing of your personal data`);
  lines.push(`- Request data portability\n`);
  lines.push(`## Third-Party Links\n`);
  lines.push(
    `Our Website may contain links to other sites. We are not responsible for the privacy practices of these external sites.\n`
  );
  lines.push(`## Changes to This Policy\n`);
  lines.push(
    `We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.\n`
  );
  lines.push(`## Contact Us\n`);
  lines.push(
    `If you have questions about this privacy policy, please contact us at ${input.email}.\n`
  );
  lines.push(
    `---\n*This is a template. Consult a legal professional to ensure compliance with applicable laws.*`
  );
  return { output: lines.join("\n") };
}

export const privacyPolicyGenerator = defineTool({
  meta: {
    id: "legal/privacy-policy-generator",
    name: "Privacy Policy Generator",
    description:
      "Free online privacy policy generator — create a privacy policy for your website instantly in your browser. No data is stored. Covers data collection, cookies, analytics, user rights, data security, and third-party links with toggleable sections.",
    category: "legal",
    tier: ToolTier.CLIENT,
    keywords: [
      "privacy",
      "policy",
      "legal",
      "gdpr",
      "template",
      "generator",
      "data-collection",
      "cookies",
      "analytics",
      "compliance",
      "website",
    ],
    examples: [
      {
        title: "SaaS platform with newsletter",
        description:
          "Generate a privacy policy for a project management SaaS that collects data, uses cookies, analytics, and has a newsletter",
        input: {
          companyName: "Acme Inc",
          websiteUrl: "https://app.example.com",
          email: "privacy@example.com",
          effectiveDate: "2025-01-01",
          collectsPersonalData: true,
          usesCookies: true,
          usesAnalytics: true,
          hasNewsletter: true,
        },
        output:
          "# Privacy Policy\n\n**Effective Date:** 2025-01-01\n\nThis privacy policy describes how Acme Inc",
      },
    ],
    ui: { outputLanguage: "markdown" },
  },
  inputSchema,
  outputSchema,
  execute,
});
