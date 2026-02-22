import { z } from "zod";
import bcrypt from "bcryptjs";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Password to verify"),
  hash: z.string().describe("Bcrypt hash to verify against"),
});

const outputSchema = z.object({
  output: z.string().describe("Verification result"),
});

export const bcryptVerifier = defineTool({
  meta: {
    id: "crypto/bcrypt-verifier",
    name: "Bcrypt Verifier",
    description:
      "Free online bcrypt verifier — verify passwords against bcrypt hashes instantly in your browser. No data is stored. Validates $2a$, $2b$, and $2y$ bcrypt hash formats with match/no-match result.",
    category: "crypto",
    subgroup: "HMAC & KDF",
    tier: ToolTier.CLIENT,
    keywords: ["bcrypt", "verify", "password", "check", "crypto"],
    icon: "ShieldCheck",
    examples: [
      {
        title: "Verify Password",
        description: "Check if a password matches a bcrypt hash",
        input: {
          input: "MyPassword123",
          hash: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
        },
        output: "NO MATCH: Password does not match the bcrypt hash",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const hashStr = input.hash.trim();

    // Validate bcrypt hash format
    const match = hashStr.match(/^\$2([aby]?)\$(\d{2})\$(.{53})$/);
    if (!match) {
      throw new Error(
        "Invalid bcrypt hash format. Expected format: $2b$XX$<53 chars>"
      );
    }

    const isMatch = bcrypt.compareSync(input.input, hashStr);

    return {
      output: isMatch
        ? "MATCH: Password matches the bcrypt hash"
        : "NO MATCH: Password does not match the bcrypt hash",
    };
  },
});
