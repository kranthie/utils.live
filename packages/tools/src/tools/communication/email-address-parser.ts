import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z
    .string()
    .describe("Email addresses in various formats (one per line)"),
});

const outputSchema = z.object({
  output: z.string().describe("Parsed email addresses as JSON"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

interface ParsedEmail {
  original: string;
  name: string;
  email: string;
  local: string;
  domain: string;
  valid: boolean;
}

function parseEmailAddress(input: string): ParsedEmail {
  const trimmed = input.trim();

  // Format: "Name" <email@domain.com>
  const quotedMatch = trimmed.match(/^"([^"]*)"?\s*<([^>]+)>/);
  if (quotedMatch) {
    const email = quotedMatch[2]!.trim();
    const [local, domain] = email.split("@");
    return {
      original: trimmed,
      name: quotedMatch[1]!,
      email,
      local: local ?? "",
      domain: domain ?? "",
      valid: isValidEmail(email),
    };
  }

  // Format: Name <email@domain.com>
  const namedMatch = trimmed.match(/^([^<]+)<([^>]+)>/);
  if (namedMatch) {
    const email = namedMatch[2]!.trim();
    const [local, domain] = email.split("@");
    return {
      original: trimmed,
      name: namedMatch[1]!.trim(),
      email,
      local: local ?? "",
      domain: domain ?? "",
      valid: isValidEmail(email),
    };
  }

  // Format: email@domain.com (Name)
  const parenMatch = trimmed.match(/^([\w.+-]+@[\w.-]+)\s*\(([^)]+)\)/);
  if (parenMatch) {
    const email = parenMatch[1]!;
    const [local, domain] = email.split("@");
    return {
      original: trimmed,
      name: parenMatch[2]!.trim(),
      email,
      local: local ?? "",
      domain: domain ?? "",
      valid: isValidEmail(email),
    };
  }

  // Format: plain email@domain.com
  const emailMatch = trimmed.match(/^([\w.+-]+@[\w.-]+)$/);
  if (emailMatch) {
    const email = emailMatch[1]!;
    const [local, domain] = email.split("@");
    return {
      original: trimmed,
      name: "",
      email,
      local: local ?? "",
      domain: domain ?? "",
      valid: isValidEmail(email),
    };
  }

  return {
    original: trimmed,
    name: "",
    email: trimmed,
    local: "",
    domain: "",
    valid: false,
  };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function execute(input: Input): Output {
  if (!input.input.trim()) {
    throw new Error("Input cannot be empty");
  }

  const lines = input.input
    .split(/[,;\n]/)
    .map((l) => l.trim())
    .filter(Boolean);
  const results = lines.map(parseEmailAddress);

  return { output: JSON.stringify(results, null, 2) };
}

export const emailAddressParser = defineTool({
  meta: {
    id: "communication/email-address-parser",
    name: "Email Address Parser",
    description:
      'Free online email address parser — extract name, local part, and domain from email addresses instantly in your browser. No data is stored. Handles Name <email>, "Name" <email>, email (Name), and plain email formats with validation.',
    category: "communication",
    subgroup: "Email",
    tier: ToolTier.CLIENT,
    keywords: [
      "email",
      "address",
      "parse",
      "name",
      "format",
      "rfc5322",
      "extract",
      "local",
      "domain",
      "mailto",
    ],
    examples: [
      {
        title: "Multiple email formats",
        description:
          "Parse named, quoted, and parenthesized email address formats",
        input:
          'Jane Doe <jane.doe@example.com>\n"Support Team" <support@example.com>\nadmin@example.com (Site Admin)',
        output:
          '[\n  {\n    "original": "Jane Doe <jane.doe@example.com>",\n    "name": "Jane Doe",\n    "email": "jane.doe@example.com",\n    "local": "jane.doe",\n    "domain": "example.com",\n    "valid": true\n  },\n  {\n    "original": "\\"Support Team\\" <support@example.com>",\n    "name": "Support Team",\n    "email": "support@example.com",\n    "local": "support",\n    "domain": "example.com",\n    "valid": true\n  },\n  {\n    "original": "admin@example.com (Site Admin)",\n    "name": "Site Admin",\n    "email": "admin@example.com",\n    "local": "admin",\n    "domain": "example.com",\n    "valid": true\n  }\n]',
      },
    ],
    ui: { outputLanguage: "json" },
  },
  inputSchema,
  outputSchema,
  execute,
});
