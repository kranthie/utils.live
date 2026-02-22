import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  length: z.number().min(3).max(12).default(4).describe("PIN length"),
  count: z
    .number()
    .min(1)
    .max(50)
    .default(1)
    .describe("Number of PINs to generate"),
  allowRepeating: z.boolean().default(true).describe("Allow repeating digits"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated PIN(s)"),
});

function secureRandomInt(max: number): number {
  const array = new Uint32Array(1);
  // Rejection sampling to eliminate modulo bias
  const limit = Math.floor(0x100000000 / max) * max;
  do {
    crypto.getRandomValues(array);
  } while (array[0]! >= limit);
  return array[0]! % max;
}

export const pinGenerator = defineTool({
  meta: {
    id: "crypto/pin-generator",
    name: "PIN Generator",
    description:
      "Free online PIN generator — generate secure random PINs instantly in your browser. No data is stored. Configurable length (3-12 digits), batch generation, and optional non-repeating digit mode.",
    category: "crypto",
    subgroup: "Password Tools",
    tier: ToolTier.CLIENT,
    keywords: ["pin", "generate", "random", "numeric", "code", "secure"],
    icon: "KeyRound",
    examples: [
      {
        title: "Generate 6-Digit PIN",
        description: "Generate a secure random 6-digit PIN",
        input: { length: 6, count: 1, allowRepeating: true },
        output:
          "(Random 6-digit PIN, e.g., 482619 — output varies due to randomness)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    if (!input.allowRepeating && input.length > 10) {
      throw new Error(
        "PIN length cannot exceed 10 digits when repeating is disabled (only 10 unique digits)"
      );
    }

    const pins: string[] = [];

    for (let n = 0; n < input.count; n++) {
      if (input.allowRepeating) {
        let pin = "";
        for (let i = 0; i < input.length; i++) {
          pin += secureRandomInt(10).toString();
        }
        pins.push(pin);
      } else {
        const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        // Fisher-Yates shuffle
        for (let i = digits.length - 1; i > 0; i--) {
          const j = secureRandomInt(i + 1);
          [digits[i], digits[j]] = [digits[j]!, digits[i]!];
        }
        pins.push(digits.slice(0, input.length).join(""));
      }
    }

    return { output: pins.join("\n") };
  },
});
