import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  minLength: z
    .number()
    .min(1)
    .max(128)
    .default(8)
    .describe("Minimum password length"),
  requireUppercase: z
    .boolean()
    .default(true)
    .describe("Require uppercase letter"),
  requireLowercase: z
    .boolean()
    .default(true)
    .describe("Require lowercase letter"),
  requireDigit: z.boolean().default(true).describe("Require digit"),
  requireSpecial: z
    .boolean()
    .default(true)
    .describe("Require special character"),
  maxLength: z
    .number()
    .min(1)
    .max(128)
    .default(128)
    .describe("Maximum password length"),
});

const outputSchema = z.object({
  output: z.string().describe("Password regex pattern and description"),
  pattern: z.string().describe("The regex pattern"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const lookaheads: string[] = [];
  const requirements: string[] = [];

  if (input.requireUppercase) {
    lookaheads.push("(?=.*[A-Z])");
    requirements.push("at least one uppercase letter");
  }
  if (input.requireLowercase) {
    lookaheads.push("(?=.*[a-z])");
    requirements.push("at least one lowercase letter");
  }
  if (input.requireDigit) {
    lookaheads.push("(?=.*\\d)");
    requirements.push("at least one digit");
  }
  if (input.requireSpecial) {
    lookaheads.push("(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?])");
    requirements.push("at least one special character");
  }

  const pattern = `^${lookaheads.join("")}.{${input.minLength},${input.maxLength}}$`;

  const lines: string[] = [];
  lines.push("Password Regex:");
  lines.push("");
  lines.push(pattern);
  lines.push("");
  lines.push("Requirements:");
  lines.push(`  - Length: ${input.minLength}-${input.maxLength} characters`);
  requirements.forEach((r) => lines.push(`  - ${r}`));

  return { output: lines.join("\n"), pattern };
}

export const passwordRegex = defineTool({
  meta: {
    id: "regex/password-regex",
    name: "Password Regex",
    description:
      "Free online password regex generator — create customizable password validation patterns with uppercase, lowercase, digit, and special character requirements instantly in your browser. No data is stored. Configurable minimum and maximum length.",
    category: "regex",
    subgroup: "Pattern Library",
    tier: ToolTier.CLIENT,
    keywords: [
      "regex",
      "password",
      "validate",
      "strength",
      "security",
      "complexity",
      "policy",
      "requirements",
    ],
    examples: [
      {
        title: "Strong password with all character types required",
        description:
          "Generate a regex for passwords requiring 8+ chars with uppercase, lowercase, digit, and special character",
        input: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireDigit: true,
          requireSpecial: true,
          maxLength: 128,
        },
        output:
          "Password Regex:\n\n^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]).{8,128}$\n\nRequirements:\n  - Length: 8-128 characters\n  - at least one uppercase letter\n  - at least one lowercase letter\n  - at least one digit\n  - at least one special character",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
