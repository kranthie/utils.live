import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Compressed IPv6 address (e.g. '2001:db8::1')"),
});
const outputSchema = z.object({
  output: z.string().describe("Expanded IPv6 address"),
});

function expandIpv6(addr: string): string {
  const expanded = addr.trim().toLowerCase();

  // Handle :: expansion
  if (expanded.includes("::")) {
    const parts = expanded.split("::");
    const left = parts[0] ? parts[0].split(":") : [];
    const right = parts[1] ? parts[1].split(":") : [];
    const missing = 8 - left.length - right.length;
    if (missing < 0) throw new Error("Invalid IPv6 address: too many groups");
    const middle: string[] = Array.from(
      { length: missing },
      (): string => "0000"
    );
    const allGroups = [...left, ...middle, ...right];
    return allGroups.map((g: string) => g.padStart(4, "0")).join(":");
  }

  const groups = expanded.split(":");
  if (groups.length !== 8)
    throw new Error(
      `Invalid IPv6 address: expected 8 groups, got ${groups.length}`
    );
  return groups.map((g: string) => g.padStart(4, "0")).join(":");
}

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");

  const lines = text
    .split(/[\n,;]+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const results: unknown[] = [];

  for (const line of lines) {
    const expanded = expandIpv6(line);
    const groups = expanded.split(":");
    const binary = groups
      .map((g) => parseInt(g, 16).toString(2).padStart(16, "0"))
      .join("");

    results.push({
      input: line,
      expanded,
      groups,
      binary: binary.match(/.{1,16}/g)?.join(":") ?? binary,
      totalBits: 128,
    });
  }

  return {
    output: JSON.stringify(
      results.length === 1 ? results[0] : results,
      null,
      2
    ),
  };
}

export const ipv6Expander = defineTool({
  meta: {
    id: "network/ipv6-expander",
    name: "IPv6 Expander",
    description:
      "Free online IPv6 expander — enter a compressed IPv6 address and get the full 8-group notation with groups, binary, and bit count instantly in your browser. No data is stored. Supports multiple addresses separated by newlines.",
    category: "network",
    subgroup: "Network",
    tier: ToolTier.CLIENT,
    keywords: [
      "ipv6",
      "expand",
      "address",
      "network",
      "full",
      "notation",
      "uncompressed",
    ],
    ui: { outputLanguage: "json" as const },
    examples: [
      {
        title: "Expand 2001:db8::1 to full notation",
        description:
          "Expand a compressed IPv6 address to all 8 groups with binary representation",
        input: "2001:db8::1",
        output:
          '{"output":"{\\n  \\"input\\": \\"2001:db8::1\\",\\n  \\"expanded\\": \\"2001:0db8:0000:0000:0000:0000:0000:0001\\",\\n  \\"groups\\": [\\n    \\"2001\\",\\n    \\"0db8\\",\\n    \\"0000\\",\\n    \\"0000\\",\\n    \\"0000\\",\\n    \\"0000\\",\\n    \\"0000\\",\\n    \\"0001\\"\\n  ],\\n  \\"binary\\": \\"0010000000000001:0000110110111000:0000000000000000:0000000000000000:0000000000000000:0000000000000000:0000000000000000:0000000000000001\\",\\n  \\"totalBits\\": 128\\n}"}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
