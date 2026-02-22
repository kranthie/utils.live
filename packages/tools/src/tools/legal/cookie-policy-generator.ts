import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  companyName: z.string().default("Company Name").describe("Company name"),
  websiteUrl: z.string().default("https://example.com").describe("Website URL"),
  email: z.string().default("privacy@example.com").describe("Contact email"),
  usesEssential: z.boolean().default(true).describe("Uses essential cookies"),
  usesAnalytics: z.boolean().default(true).describe("Uses analytics cookies"),
  usesMarketing: z.boolean().default(false).describe("Uses marketing cookies"),
  usesPreferences: z
    .boolean()
    .default(true)
    .describe("Uses preference cookies"),
});
const outputSchema = z.object({
  output: z.string().describe("Generated cookie policy"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const types: string[] = [];
  if (input.usesEssential)
    types.push(
      `### Essential Cookies\nThese cookies are necessary for the Website to function and cannot be switched off. They are usually set in response to actions made by you, such as setting your privacy preferences, logging in, or filling in forms.`
    );
  if (input.usesAnalytics)
    types.push(
      `### Analytics Cookies\nThese cookies allow us to count visits and traffic sources so we can measure and improve the performance of our Website. They help us know which pages are the most and least popular.`
    );
  if (input.usesMarketing)
    types.push(
      `### Marketing Cookies\nThese cookies may be set through our Website by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant advertisements on other sites.`
    );
  if (input.usesPreferences)
    types.push(
      `### Preference Cookies\nThese cookies enable the Website to provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages.`
    );

  return {
    output: `# Cookie Policy

**Website:** ${input.websiteUrl}
**Company:** ${input.companyName}

## What Are Cookies

Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently and to provide information to the website owners.

## How We Use Cookies

${input.companyName} uses cookies on ${input.websiteUrl} for the following purposes:

${types.join("\n\n")}

## Managing Cookies

Most web browsers allow you to control cookies through their settings preferences. However, if you limit the ability of websites to set cookies, you may affect your overall user experience.

### How to Control Cookies in Your Browser

- **Chrome:** Settings > Privacy and Security > Cookies
- **Firefox:** Options > Privacy & Security > Cookies
- **Safari:** Preferences > Privacy > Cookies
- **Edge:** Settings > Privacy & Security > Cookies

## Third-Party Cookies

Some cookies are placed by third-party services that appear on our pages. We do not control the dissemination of these cookies.

## Updates to This Policy

We may update this Cookie Policy from time to time. We encourage you to review this page periodically for the latest information on our cookie practices.

## Contact Us

If you have questions about our use of cookies, please contact us at ${input.email}.

---
*This is a template. Consult a legal professional to ensure compliance with applicable laws.*`,
  };
}

export const cookiePolicyGenerator = defineTool({
  meta: {
    id: "legal/cookie-policy-generator",
    name: "Cookie Policy Generator",
    description:
      "Free online cookie policy generator — create a cookie policy for your website instantly in your browser. No data is stored. Covers essential, analytics, marketing, and preference cookies with browser control instructions and third-party cookie disclosures.",
    category: "legal",
    tier: ToolTier.CLIENT,
    keywords: [
      "cookie",
      "policy",
      "legal",
      "gdpr",
      "template",
      "generator",
      "consent",
      "privacy",
      "compliance",
      "eu",
      "tracking",
    ],
    examples: [
      {
        title: "E-commerce site with all cookie types",
        description:
          "Generate a full cookie policy for an online store using essential, analytics, marketing, and preference cookies",
        input: {
          companyName: "Acme Store",
          websiteUrl: "https://store.example.com",
          email: "privacy@example.com",
          usesEssential: true,
          usesAnalytics: true,
          usesMarketing: true,
          usesPreferences: true,
        },
        output:
          "# Cookie Policy\n\n**Website:** https://store.example.com\n**Company:** Acme Store",
      },
    ],
    ui: { outputLanguage: "markdown" },
  },
  inputSchema,
  outputSchema,
  execute,
});
