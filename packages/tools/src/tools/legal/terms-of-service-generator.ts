import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  companyName: z.string().default("Company Name").describe("Company name"),
  websiteUrl: z.string().default("https://example.com").describe("Website URL"),
  email: z.string().default("legal@example.com").describe("Contact email"),
  effectiveDate: z.string().default("2025-01-01").describe("Effective date"),
  governingLaw: z
    .string()
    .default("State of California, United States")
    .describe("Governing law jurisdiction"),
});
const outputSchema = z.object({
  output: z.string().describe("Generated terms of service"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  return {
    output: `# Terms of Service

**Effective Date:** ${input.effectiveDate}

## 1. Acceptance of Terms

By accessing and using ${input.websiteUrl} ("the Website"), operated by ${input.companyName} ("we", "us", or "our"), you agree to be bound by these Terms of Service. If you do not agree, please do not use our Website.

## 2. Use of the Website

You agree to use the Website only for lawful purposes. You must not use the Website in any way that could damage, disable, or impair the Website or interfere with any other party's use of the Website.

## 3. Intellectual Property

All content on this Website, including text, graphics, logos, and software, is the property of ${input.companyName} and is protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without our prior written consent.

## 4. User Content

If you submit content to the Website, you grant us a non-exclusive, worldwide, royalty-free license to use, reproduce, and display such content in connection with the Website.

## 5. Disclaimer of Warranties

The Website is provided "as is" without warranties of any kind, either express or implied. We do not warrant that the Website will be uninterrupted, error-free, or free of harmful components.

## 6. Limitation of Liability

In no event shall ${input.companyName} be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Website.

## 7. Indemnification

You agree to indemnify and hold harmless ${input.companyName} from any claims, damages, or expenses arising from your use of the Website or your violation of these Terms.

## 8. Termination

We reserve the right to terminate or suspend your access to the Website at our sole discretion, without notice, for any reason.

## 9. Changes to Terms

We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting to the Website.

## 10. Governing Law

These Terms shall be governed by the laws of ${input.governingLaw}, without regard to conflict of law principles.

## 11. Contact

For questions about these Terms, contact us at ${input.email}.

---
*This is a template. Consult a legal professional to ensure compliance with applicable laws.*`,
  };
}

export const termsOfServiceGenerator = defineTool({
  meta: {
    id: "legal/terms-of-service-generator",
    name: "Terms of Service Generator",
    description:
      "Free online terms of service generator — create ToS for your website instantly in your browser. No data is stored. Covers acceptance of terms, intellectual property, user content, warranties, liability, indemnification, termination, and governing law.",
    category: "legal",
    tier: ToolTier.CLIENT,
    keywords: [
      "terms",
      "service",
      "legal",
      "tos",
      "template",
      "generator",
      "agreement",
      "conditions",
      "website",
      "eula",
    ],
    examples: [
      {
        title: "Web app ToS under California law",
        description:
          "Generate terms of service for a SaaS web application governed by California law",
        input: {
          companyName: "Acme Inc",
          websiteUrl: "https://app.example.com",
          email: "legal@example.com",
          effectiveDate: "2025-06-01",
          governingLaw: "State of California, United States",
        },
        output:
          "# Terms of Service\n\n**Effective Date:** 2025-06-01\n\n## 1. Acceptance of Terms\n\nBy accessing and using https://app.example.com",
      },
    ],
    ui: { outputLanguage: "markdown" },
  },
  inputSchema,
  outputSchema,
  execute,
});
