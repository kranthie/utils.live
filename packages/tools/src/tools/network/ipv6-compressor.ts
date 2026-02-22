import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z
    .string()
    .describe(
      "Full IPv6 address (e.g. '2001:0db8:0000:0000:0000:0000:0000:0001')"
    ),
});
const outputSchema = z.object({
  output: z.string().describe("Compressed IPv6 address"),
});

function compressIpv6(addr: string): string {
  const expanded = addr.trim().toLowerCase();
  const groups = expanded.split(":");
  if (groups.length !== 8)
    throw new Error(`Invalid IPv6: expected 8 groups, got ${groups.length}`);

  // Validate all groups
  for (const g of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(g)) throw new Error(`Invalid IPv6 group: ${g}`);
  }

  // Remove leading zeros from each group
  const stripped = groups.map((g) => g.replace(/^0+/, "") || "0");

  // Find longest run of consecutive "0" groups
  let bestStart = -1,
    bestLen = 0;
  let curStart = -1,
    curLen = 0;
  for (let i = 0; i < stripped.length; i++) {
    if (stripped[i] === "0") {
      if (curStart === -1) curStart = i;
      curLen++;
      if (curLen > bestLen) {
        bestStart = curStart;
        bestLen = curLen;
      }
    } else {
      curStart = -1;
      curLen = 0;
    }
  }

  // Replace longest run with ::
  if (bestLen >= 2) {
    const left = stripped.slice(0, bestStart).join(":");
    const right = stripped.slice(bestStart + bestLen).join(":");
    if (!left && !right) return "::";
    if (!left) return "::" + right;
    if (!right) return left + "::";
    return left + "::" + right;
  }

  return stripped.join(":");
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
    // First expand if partially compressed
    let expanded = line;
    if (line.includes("::")) {
      const parts = line.split("::");
      const left = parts[0] ? parts[0].split(":") : [];
      const right = parts[1] ? parts[1].split(":") : [];
      const missing = 8 - left.length - right.length;
      const middle: string[] = Array.from(
        { length: missing },
        (): string => "0000"
      );
      expanded = [...left, ...middle, ...right]
        .map((g: string) => g.padStart(4, "0"))
        .join(":");
    }

    const compressed = compressIpv6(expanded);
    results.push({
      input: line,
      compressed,
      expanded: expanded
        .split(":")
        .map((g: string) => g.padStart(4, "0"))
        .join(":"),
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

export const ipv6Compressor = defineTool({
  meta: {
    id: "network/ipv6-compressor",
    name: "IPv6 Compressor",
    description:
      "Free online IPv6 compressor — enter a full or partial IPv6 address and get the shortest compressed form using :: notation instantly in your browser. No data is stored. Supports multiple addresses separated by newlines.",
    category: "network",
    subgroup: "Network",
    tier: ToolTier.CLIENT,
    keywords: [
      "ipv6",
      "compress",
      "shorten",
      "address",
      "network",
      "notation",
      "abbreviate",
    ],
    ui: { outputLanguage: "json" as const },
    examples: [
      {
        title: "Compress full IPv6 to 2001:db8::1",
        description:
          "Shorten 2001:0db8:0000:0000:0000:0000:0000:0001 using :: notation",
        input: "2001:0db8:0000:0000:0000:0000:0000:0001",
        output:
          '{"output":"{\\n  \\"input\\": \\"2001:0db8:0000:0000:0000:0000:0000:0001\\",\\n  \\"compressed\\": \\"2001:db8::1\\",\\n  \\"expanded\\": \\"2001:0db8:0000:0000:0000:0000:0000:0001\\"\\n}"}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
