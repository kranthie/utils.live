import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("String to hash"),
});

const outputSchema = z.object({
  output: z.string().describe("Hash values"),
});

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function sdbm(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + (hash << 6) + (hash << 16) - hash;
    hash = hash >>> 0;
  }
  return hash;
}

function fnv1a(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  if (!input.input) {
    throw new Error("Input cannot be empty");
  }

  const results = [
    `DJB2:   ${djb2(input.input).toString(16)} (${djb2(input.input)})`,
    `SDBM:   ${sdbm(input.input).toString(16)} (${sdbm(input.input)})`,
    `FNV-1a: ${fnv1a(input.input).toString(16)} (${fnv1a(input.input)})`,
  ];

  return { output: results.join("\n") };
}

export const stringHash = defineTool({
  meta: {
    id: "crypto/string-hash",
    name: "String Hash",
    description:
      "Free online string hash calculator — compute DJB2, SDBM, and FNV-1a hashes instantly in your browser. No data is stored. Outputs 32-bit non-cryptographic hashes in hex and decimal for hash tables and data distribution.",
    category: "crypto",
    subgroup: "String Hash",
    tier: ToolTier.CLIENT,
    keywords: ["string", "hash", "djb2", "sdbm", "fnv"],
    examples: [
      {
        title: "Hash a String",
        description: "Compute DJB2, SDBM, and FNV-1a hashes for a string",
        input: "hello",
        output:
          "DJB2:   f923099 (261238937)\nSDBM:   28d19932 (684824882)\nFNV-1a: 4f9f2cab (1335831723)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
