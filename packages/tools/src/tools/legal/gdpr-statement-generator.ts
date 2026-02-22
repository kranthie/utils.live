import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  companyName: z.string().default("Company Name").describe("Company name"),
  email: z
    .string()
    .default("dpo@example.com")
    .describe("Data Protection Officer email"),
  country: z.string().default("Germany").describe("Company country"),
  dataTypes: z
    .string()
    .default("name, email, IP address")
    .describe("Types of data collected"),
});
const outputSchema = z.object({
  output: z.string().describe("Generated GDPR statement"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  return {
    output: `# GDPR Compliance Statement

## Data Controller

${input.companyName}, located in ${input.country}, acts as the data controller for personal data collected through our services.

**Data Protection Officer Contact:** ${input.email}

## Personal Data We Collect

We collect the following categories of personal data: ${input.dataTypes}.

## Legal Basis for Processing

We process your personal data based on:
- **Consent** - Where you have given clear consent
- **Contract** - Where processing is necessary for a contract with you
- **Legal obligation** - Where processing is necessary for compliance with a legal obligation
- **Legitimate interests** - Where processing is necessary for our legitimate interests

## Your Rights Under GDPR

As a data subject, you have the following rights:

1. **Right of Access** (Article 15) - You can request a copy of your personal data
2. **Right to Rectification** (Article 16) - You can request correction of inaccurate data
3. **Right to Erasure** (Article 17) - You can request deletion of your data ("right to be forgotten")
4. **Right to Restrict Processing** (Article 18) - You can request limitation of processing
5. **Right to Data Portability** (Article 20) - You can request your data in a portable format
6. **Right to Object** (Article 21) - You can object to processing based on legitimate interests
7. **Right Not to Be Subject to Automated Decision-Making** (Article 22)

## Data Retention

We retain personal data only for as long as necessary to fulfill the purposes for which it was collected, or as required by applicable laws and regulations.

## Data Transfers

If we transfer personal data outside the European Economic Area (EEA), we ensure appropriate safeguards are in place, such as Standard Contractual Clauses or adequacy decisions.

## Data Breach Notification

In the event of a personal data breach, we will notify the relevant supervisory authority within 72 hours and affected individuals without undue delay when required.

## Exercising Your Rights

To exercise any of your rights, please contact our Data Protection Officer at ${input.email}. We will respond to your request within 30 days.

## Supervisory Authority

You have the right to lodge a complaint with a supervisory authority if you believe your data protection rights have been violated.

---
*This is a template. Consult a legal professional to ensure full GDPR compliance.*`,
  };
}

export const gdprStatementGenerator = defineTool({
  meta: {
    id: "legal/gdpr-statement-generator",
    name: "GDPR Statement Generator",
    description:
      "Free online GDPR statement generator — create a GDPR compliance statement for your website instantly in your browser. No data is stored. Covers data controller details, legal basis, all seven data subject rights, breach notification, and data transfer safeguards.",
    category: "legal",
    tier: ToolTier.CLIENT,
    keywords: [
      "gdpr",
      "privacy",
      "data",
      "protection",
      "eu",
      "compliance",
      "legal",
      "dpo",
      "data-subject-rights",
      "european",
      "regulation",
    ],
    examples: [
      {
        title: "SaaS company GDPR statement (Germany)",
        description:
          "Generate a GDPR compliance statement for a German SaaS company collecting user analytics data",
        input: {
          companyName: "Acme GmbH",
          email: "dpo@example.com",
          country: "Germany",
          dataTypes: "name, email, IP address, usage data",
        },
        output:
          "# GDPR Compliance Statement\n\n## Data Controller\n\nAcme GmbH, located in Germany, acts as the data controller",
      },
    ],
    ui: { outputLanguage: "markdown" },
  },
  inputSchema,
  outputSchema,
  execute,
});
