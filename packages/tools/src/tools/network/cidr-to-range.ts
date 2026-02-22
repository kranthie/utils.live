import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("CIDR notation (e.g. '192.168.1.0/24')"),
});
const outputSchema = z.object({
  output: z.string().describe("IP range details"),
});

function parseIp(ip: string): number {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255))
    throw new Error(`Invalid IP: ${ip}`);
  return (
    ((parts[0]! << 24) | (parts[1]! << 16) | (parts[2]! << 8) | parts[3]!) >>> 0
  );
}

function numToIp(num: number): string {
  return [
    (num >>> 24) & 0xff,
    (num >>> 16) & 0xff,
    (num >>> 8) & 0xff,
    num & 0xff,
  ].join(".");
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
    const match = line.match(
      /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/
    );
    if (!match)
      throw new Error(`Invalid CIDR: ${line}. Expected format: x.x.x.x/y`);

    const ipNum = parseIp(match[1]!);
    const prefix = parseInt(match[2]!, 10);
    if (prefix < 0 || prefix > 32)
      throw new Error(`Invalid prefix: /${prefix}`);

    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    const network = (ipNum & mask) >>> 0;
    const broadcast = (network | (~mask >>> 0)) >>> 0;
    const total = Math.pow(2, 32 - prefix);

    results.push({
      cidr: `${numToIp(network)}/${prefix}`,
      firstIp: numToIp(network),
      lastIp: numToIp(broadcast),
      totalAddresses: total,
      usableHosts: prefix >= 31 ? total : Math.max(total - 2, 0),
      subnetMask: numToIp(mask),
      wildcardMask: numToIp(~mask >>> 0),
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

export const cidrToRange = defineTool({
  meta: {
    id: "network/cidr-to-range",
    name: "CIDR to Range",
    description:
      "Free online CIDR to IP range converter — enter CIDR notation and get the first IP, last IP, total addresses, usable hosts, and subnet mask instantly in your browser. No data is stored. Supports multiple CIDRs.",
    category: "network",
    subgroup: "Network",
    tier: ToolTier.CLIENT,
    keywords: [
      "cidr",
      "range",
      "ip",
      "convert",
      "network",
      "subnet",
      "first",
      "last",
      "usable",
    ],
    ui: { outputLanguage: "json" as const },
    examples: [
      {
        title: "Convert 10.0.0.0/24 to IP range",
        description:
          "Get first IP, last IP, total addresses, and usable hosts for a /24 block",
        input: "10.0.0.0/24",
        output:
          '{"output":"{\\n  \\"cidr\\": \\"10.0.0.0/24\\",\\n  \\"firstIp\\": \\"10.0.0.0\\",\\n  \\"lastIp\\": \\"10.0.0.255\\",\\n  \\"totalAddresses\\": 256,\\n  \\"usableHosts\\": 254,\\n  \\"subnetMask\\": \\"255.255.255.0\\",\\n  \\"wildcardMask\\": \\"0.0.0.255\\"\\n}"}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
