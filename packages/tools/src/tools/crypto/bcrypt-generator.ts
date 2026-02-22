import { z } from "zod";
import bcrypt from "bcryptjs";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().min(1).max(72).describe("Password to hash (max 72 bytes)"),
});

const outputSchema = z.object({
  output: z.string().describe("Bcrypt hash string"),
});

const optionsSchema = z.object({
  rounds: z
    .number()
    .min(4)
    .max(12, "Maximum 12 rounds allowed to prevent excessive computation time")
    .default(10)
    .describe("Cost factor (log2 rounds, max 12)"),
});

export const bcryptGenerator = defineTool({
  meta: {
    id: "crypto/bcrypt-generator",
    name: "Bcrypt Hash Generator",
    description:
      "Free online bcrypt hash generator — generate bcrypt password hashes instantly in your browser. No data is stored. Supports configurable cost factor (4-12 rounds) with random salt per hash.",
    category: "crypto",
    subgroup: "HMAC & KDF",
    tier: ToolTier.CLIENT,
    keywords: ["bcrypt", "password", "hash", "salt", "crypto"],
    icon: "Lock",
    examples: [
      {
        title: "Hash Password",
        description:
          "Generate a bcrypt hash for secure password storage (output varies due to random salt)",
        input: "my-secret-password",
        output:
          "(Bcrypt hash string, e.g., $2a$10$... — output varies due to random salt)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute: (input, options) => {
    const rounds = options?.rounds ?? 10;
    const salt = bcrypt.genSaltSync(rounds);
    const hash = bcrypt.hashSync(input.input, salt);
    return { output: hash };
  },
});
