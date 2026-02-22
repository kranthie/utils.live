import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  length: z.number().min(4).max(128).default(16).describe("Password length"),
  includeUppercase: z
    .boolean()
    .default(true)
    .describe("Include uppercase letters"),
  includeLowercase: z
    .boolean()
    .default(true)
    .describe("Include lowercase letters"),
  includeNumbers: z.boolean().default(true).describe("Include numbers"),
  includeSymbols: z.boolean().default(false).describe("Include symbols"),
  excludeAmbiguous: z
    .boolean()
    .default(false)
    .describe("Exclude ambiguous chars (0OIl1)"),
  count: z
    .number()
    .min(1)
    .max(50)
    .default(1)
    .describe("Number of passwords to generate"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated password(s)"),
});

const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:',.<>?/~`";
const AMBIGUOUS = "0OIl1";

function secureRandomInt(max: number): number {
  const array = new Uint32Array(1);
  // Rejection sampling to eliminate modulo bias
  const limit = Math.floor(0x100000000 / max) * max;
  do {
    crypto.getRandomValues(array);
  } while (array[0]! >= limit);
  return array[0]! % max;
}

export const passwordGenerator = defineTool({
  meta: {
    id: "crypto/password-generator",
    name: "Password Generator",
    description:
      "Free online password generator — generate secure random passwords instantly in your browser. No data is stored. Configurable length, character sets (uppercase, lowercase, numbers, symbols), and ambiguous character exclusion.",
    category: "crypto",
    subgroup: "Password Tools",
    tier: ToolTier.CLIENT,
    keywords: ["password", "generate", "random", "secure", "crypto"],
    icon: "KeyRound",
    examples: [
      {
        title: "16-Char Password",
        description:
          "Generate a 16-character password with letters and numbers (output varies due to randomness)",
        input: {
          length: 16,
          includeUppercase: true,
          includeLowercase: true,
          includeNumbers: true,
          includeSymbols: false,
          excludeAmbiguous: false,
          count: 1,
        },
        output:
          "(Generated 16-character password, e.g., kR7mN2xP9bQ4wL5j — output varies due to randomness)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    let charset = "";

    if (input.includeUppercase) charset += UPPERCASE;
    if (input.includeLowercase) charset += LOWERCASE;
    if (input.includeNumbers) charset += NUMBERS;
    if (input.includeSymbols) charset += SYMBOLS;

    if (!charset) {
      throw new Error("At least one character set must be enabled");
    }

    if (input.excludeAmbiguous) {
      charset = charset
        .split("")
        .filter((c) => !AMBIGUOUS.includes(c))
        .join("");
    }

    const passwords: string[] = [];

    for (let n = 0; n < input.count; n++) {
      let password = "";
      for (let i = 0; i < input.length; i++) {
        password += charset[secureRandomInt(charset.length)]!;
      }
      passwords.push(password);
    }

    return { output: passwords.join("\n") };
  },
});
