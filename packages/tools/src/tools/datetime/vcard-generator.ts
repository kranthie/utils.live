import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  firstName: z.string().default("John").describe("First name"),
  lastName: z.string().default("Doe").describe("Last name"),
  email: z.string().default("").describe("Email address"),
  phone: z.string().default("").describe("Phone number"),
  organization: z.string().default("").describe("Organization/company"),
  title: z.string().default("").describe("Job title"),
  address: z.string().default("").describe("Street address"),
  city: z.string().default("").describe("City"),
  state: z.string().default("").describe("State/province"),
  zip: z.string().default("").describe("ZIP/postal code"),
  country: z.string().default("").describe("Country"),
  website: z.string().default("").describe("Website URL"),
  note: z.string().default("").describe("Additional notes"),
});

const outputSchema = z.object({
  output: z.string().describe("vCard content"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${input.lastName};${input.firstName};;;`,
    `FN:${input.firstName} ${input.lastName}`,
  ];

  if (input.organization) lines.push(`ORG:${input.organization}`);
  if (input.title) lines.push(`TITLE:${input.title}`);
  if (input.email) lines.push(`EMAIL;TYPE=INTERNET:${input.email}`);
  if (input.phone) lines.push(`TEL;TYPE=CELL:${input.phone}`);

  if (
    input.address ||
    input.city ||
    input.state ||
    input.zip ||
    input.country
  ) {
    lines.push(
      `ADR;TYPE=HOME:;;${input.address};${input.city};${input.state};${input.zip};${input.country}`
    );
  }

  if (input.website) lines.push(`URL:${input.website}`);
  if (input.note) lines.push(`NOTE:${input.note}`);

  lines.push(`REV:${new Date().toISOString()}`);
  lines.push("END:VCARD");

  return { output: lines.join("\r\n") };
}

// FIXME(category-mismatch): Tool belongs in 'communication' category, not 'datetime'. Tracked in DC-006.
export const vcardGenerator = defineTool({
  meta: {
    id: "datetime/vcard-generator",
    name: "vCard Generator",
    description:
      "Free online vCard generator — create vCard (.vcf) contact file content instantly in your browser. No data is stored. Supports name, email, phone, address, organization, and website fields.",
    category: "datetime",
    subgroup: "Calendar",
    tier: ToolTier.CLIENT,
    keywords: ["vcard", "vcf", "contact", "generate", "address book"],
    examples: [
      {
        title: "Business Contact",
        description: "Generate a vCard for a business contact",
        input: {
          firstName: "Jane",
          lastName: "Smith",
          email: "jane.smith@example.com",
          phone: "+1-555-0123",
          organization: "Acme Corp",
          title: "Software Engineer",
          address: "",
          city: "San Francisco",
          state: "CA",
          zip: "94105",
          country: "US",
          website: "https://janesmith.dev",
          note: "",
        },
        output: "(vCard output — REV field varies based on current time)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
