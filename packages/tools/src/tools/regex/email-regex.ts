import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  strictness: z
    .enum(["basic", "standard", "strict"])
    .default("standard")
    .describe("Validation strictness level"),
});

const outputSchema = z.object({
  output: z.string().describe("Email regex pattern"),
  pattern: z.string().describe("The regex pattern"),
  description: z.string().describe("Pattern description"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

const PATTERNS: Record<string, { pattern: string; desc: string }> = {
  basic: {
    pattern: "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$",
    desc: "Basic email check: something@something.something",
  },
  standard: {
    pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
    desc: "Standard email validation: alphanumeric with common special chars",
  },
  strict: {
    pattern:
      "^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|\"(?:[\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f\\x21\\x23-\\x5b\\x5d-\\x7f]|\\\\[\\x01-\\x09\\x0b\\x0c\\x0e-\\x7f])*\")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f\\x21-\\x5a\\x53-\\x7f]|\\\\[\\x01-\\x09\\x0b\\x0c\\x0e-\\x7f])+)\\])$",
    desc: "RFC 5322 compliant email validation (comprehensive)",
  },
};

function execute(input: Input): Output {
  const p = PATTERNS[input.strictness]!;
  const lines: string[] = [];
  lines.push(`Email Regex (${input.strictness}):`);
  lines.push("");
  lines.push(p.pattern);
  lines.push("");
  lines.push(p.desc);
  lines.push("");
  lines.push("Usage: new RegExp(pattern) or /pattern/i for case-insensitive");

  return {
    output: lines.join("\n"),
    pattern: p.pattern,
    description: p.desc,
  };
}

export const emailRegex = defineTool({
  meta: {
    id: "regex/email-regex",
    name: "Email Regex",
    description:
      "Free online email regex generator — create email validation patterns at basic, standard, and strict levels instantly in your browser. No data is stored. Configurable strictness from simple format checks to RFC-compliant patterns.",
    category: "regex",
    subgroup: "Pattern Library",
    tier: ToolTier.CLIENT,
    keywords: [
      "regex",
      "email",
      "validate",
      "pattern",
      "rfc5322",
      "address",
      "format",
      "verify",
    ],
    examples: [
      {
        title: "Standard email address validation pattern",
        description: "Generate a standard email validation regex pattern",
        input: "standard",
        output:
          "Email Regex (standard):\n\n^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$\n\nStandard email validation: alphanumeric with common special chars\n\nUsage: new RegExp(pattern) or /pattern/i for case-insensitive",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
