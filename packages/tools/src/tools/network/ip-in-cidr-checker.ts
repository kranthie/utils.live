import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input1: z.string().describe("IP address to check"),
  input2: z
    .string()
    .describe(
      "CIDR range (e.g. '192.168.1.0/24') or multiple CIDRs on separate lines"
    ),
});
const outputSchema = z.object({ output: z.string().describe("Check result") });

function parseIp(ip: string): number {
  const parts = ip.trim().split(".").map(Number);
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
  const ipStr = input.input1.trim();
  const cidrStr = input.input2.trim();
  if (!ipStr) throw new Error("IP address cannot be empty");
  if (!cidrStr) throw new Error("CIDR range cannot be empty");

  const ipNum = parseIp(ipStr);
  const cidrs = cidrStr
    .split(/[\n,;]+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const results: unknown[] = [];

  for (const cidr of cidrs) {
    const match = cidr.match(
      /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/
    );
    if (!match) throw new Error(`Invalid CIDR: ${cidr}`);

    const netIp = parseIp(match[1]!);
    const prefix = parseInt(match[2]!, 10);
    if (prefix < 0 || prefix > 32)
      throw new Error(`Invalid prefix: /${prefix}`);

    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    const network = (netIp & mask) >>> 0;
    const broadcast = (network | (~mask >>> 0)) >>> 0;
    const isInRange = ipNum >= network && ipNum <= broadcast;

    results.push({
      ip: ipStr,
      cidr: `${numToIp(network)}/${prefix}`,
      isInRange,
      networkAddress: numToIp(network),
      broadcastAddress: numToIp(broadcast),
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

export const ipInCidrChecker = defineTool({
  meta: {
    id: "network/ip-in-cidr-checker",
    name: "IP in CIDR Checker",
    description:
      "Free online IP-in-CIDR checker — enter an IP address and a CIDR range to check if the IP falls within the subnet instantly in your browser. No data is stored. Shows network address, broadcast address, and match result for multiple CIDRs.",
    category: "network",
    subgroup: "Network",
    tier: ToolTier.CLIENT,
    keywords: [
      "ip",
      "cidr",
      "check",
      "range",
      "contains",
      "network",
      "subnet",
      "membership",
    ],
    ui: { outputLanguage: "json" as const },
    examples: [
      {
        title: "Check if 192.168.1.50 is in 192.168.1.0/24",
        description:
          "Verify an IP address belongs to a /24 subnet and see network details",
        input: { input1: "192.168.1.50", input2: "192.168.1.0/24" },
        output:
          '{"output":"{\\n  \\"ip\\": \\"192.168.1.50\\",\\n  \\"cidr\\": \\"192.168.1.0/24\\",\\n  \\"isInRange\\": true,\\n  \\"networkAddress\\": \\"192.168.1.0\\",\\n  \\"broadcastAddress\\": \\"192.168.1.255\\"\\n}"}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
