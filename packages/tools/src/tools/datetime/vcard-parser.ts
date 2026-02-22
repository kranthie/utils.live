import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("vCard (.vcf) file content"),
});

const outputSchema = z.object({
  output: z.string().describe("Parsed contact information"),
  contacts: z
    .array(
      z.object({
        name: z.string(),
        email: z.string(),
        phone: z.string(),
        organization: z.string(),
        title: z.string(),
      })
    )
    .describe("Parsed contacts"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const content = input.input.trim();
  if (!content) throw new Error("Input cannot be empty");

  if (!content.includes("BEGIN:VCARD")) {
    throw new Error("Invalid vCard format: missing BEGIN:VCARD");
  }

  const contacts: Array<{
    name: string;
    email: string;
    phone: string;
    organization: string;
    title: string;
  }> = [];

  const cardBlocks = content.split("BEGIN:VCARD");
  for (let i = 1; i < cardBlocks.length; i++) {
    const block = cardBlocks[i]!.split("END:VCARD")[0] || "";
    const lines = block.split(/\r?\n/);

    let name = "";
    let email = "";
    let phone = "";
    let organization = "";
    let title = "";

    for (const line of lines) {
      if (line.startsWith("FN:")) name = line.slice(3);
      else if (line.startsWith("N:")) {
        if (!name) {
          const parts = line.slice(2).split(";");
          name = `${parts[1] || ""} ${parts[0] || ""}`.trim();
        }
      } else if (line.includes("EMAIL")) {
        email = line.split(":").slice(1).join(":");
      } else if (line.includes("TEL")) {
        phone = line.split(":").slice(1).join(":");
      } else if (line.startsWith("ORG:")) {
        organization = line.slice(4);
      } else if (line.startsWith("TITLE:")) {
        title = line.slice(6);
      }
    }

    contacts.push({ name, email, phone, organization, title });
  }

  const outputLines: string[] = [];
  outputLines.push(`Found ${contacts.length} contact(s)`);
  outputLines.push("");

  for (const contact of contacts) {
    outputLines.push(`Name: ${contact.name || "(unnamed)"}`);
    if (contact.email) outputLines.push(`Email: ${contact.email}`);
    if (contact.phone) outputLines.push(`Phone: ${contact.phone}`);
    if (contact.organization)
      outputLines.push(`Organization: ${contact.organization}`);
    if (contact.title) outputLines.push(`Title: ${contact.title}`);
    outputLines.push("");
  }

  return { output: outputLines.join("\n"), contacts };
}

// FIXME(category-mismatch): Tool belongs in 'communication' category, not 'datetime'. Tracked in DC-006.
export const vcardParser = defineTool({
  meta: {
    id: "datetime/vcard-parser",
    name: "vCard Parser",
    description:
      "Free online vCard parser — parse vCard (.vcf) contact file content into structured data instantly in your browser. No data is stored. Extracts name, email, phone, organization, and title.",
    category: "datetime",
    subgroup: "Calendar",
    tier: ToolTier.CLIENT,
    keywords: ["vcard", "vcf", "parse", "contact", "address book"],
    examples: [
      {
        title: "Parse vCard",
        description: "Parse a vCard file to extract contact information",
        input:
          "BEGIN:VCARD\r\nVERSION:3.0\r\nN:Smith;Jane;;;\r\nFN:Jane Smith\r\nEMAIL;TYPE=INTERNET:jane@example.com\r\nTEL;TYPE=CELL:+1-555-0123\r\nORG:Acme Corp\r\nTITLE:Engineer\r\nEND:VCARD",
        output:
          "Found 1 contact(s)\n\nName: Jane Smith\nEmail: jane@example.com\nPhone: +1-555-0123\nOrganization: Acme Corp\nTitle: Engineer\n",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
