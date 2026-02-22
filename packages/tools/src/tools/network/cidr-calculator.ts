import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { INPUT_INVALID_FORMAT } from "../../core/error-codes";

const inputSchema = z.object({
  input: z
    .string()
    .describe(
      "CIDR notation (e.g. '10.0.0.0/8') or multiple CIDRs separated by newlines"
    ),
});

const cidrEntrySchema = z.object({
  cidr: z.string().describe("CIDR notation"),
  networkAddress: z.string().describe("Network address"),
  broadcastAddress: z.string().describe("Broadcast address"),
  firstIp: z.string().describe("First IP in range"),
  lastIp: z.string().describe("Last IP in range"),
  totalAddresses: z.number().describe("Total addresses in range"),
  subnetMask: z.string().describe("Subnet mask"),
  wildcardMask: z.string().describe("Wildcard mask"),
});

const outputSchema = z.object({
  ranges: z.array(cidrEntrySchema).describe("Calculated CIDR ranges"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function parseIpToNumber(ip: string): number {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    throw createToolError({
      code: INPUT_INVALID_FORMAT,
      message: `Invalid IP address: ${ip}`,
    });
  }
  return (
    ((parts[0]! << 24) | (parts[1]! << 16) | (parts[2]! << 8) | parts[3]!) >>> 0
  );
}

function numberToIp(num: number): string {
  return [
    (num >>> 24) & 0xff,
    (num >>> 16) & 0xff,
    (num >>> 8) & 0xff,
    num & 0xff,
  ].join(".");
}

function cidrToMask(cidr: number): number {
  if (cidr === 0) return 0;
  return (~0 << (32 - cidr)) >>> 0;
}

function execute(input: Input): Output {
  const lines = input.input
    .trim()
    .split(/[\n,;]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    throw createToolError({
      code: INPUT_INVALID_FORMAT,
      message: "Please provide at least one CIDR notation (e.g. 10.0.0.0/8)",
    });
  }

  const ranges = lines.map((line) => {
    const match = line.match(
      /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/
    );
    if (!match) {
      throw createToolError({
        code: INPUT_INVALID_FORMAT,
        message: `Invalid CIDR notation: ${line}. Expected format: x.x.x.x/y`,
      });
    }

    const ipStr = match[1]!;
    const cidr = parseInt(match[2]!, 10);

    if (cidr < 0 || cidr > 32) {
      throw createToolError({
        code: INPUT_INVALID_FORMAT,
        message: `Invalid CIDR prefix: /${cidr}. Must be between 0 and 32.`,
      });
    }

    const ipNum = parseIpToNumber(ipStr);
    const maskNum = cidrToMask(cidr);
    const wildcardNum = ~maskNum >>> 0;
    const networkNum = (ipNum & maskNum) >>> 0;
    const broadcastNum = (networkNum | wildcardNum) >>> 0;
    const totalAddresses = Math.pow(2, 32 - cidr);

    return {
      cidr: `${numberToIp(networkNum)}/${cidr}`,
      networkAddress: numberToIp(networkNum),
      broadcastAddress: numberToIp(broadcastNum),
      firstIp: numberToIp(networkNum),
      lastIp: numberToIp(broadcastNum),
      totalAddresses,
      subnetMask: numberToIp(maskNum),
      wildcardMask: numberToIp(wildcardNum),
    };
  });

  return { ranges };
}

export const cidrCalculator = defineTool({
  meta: {
    id: "network/cidr-calculator",
    name: "CIDR Calculator",
    description:
      "Free online CIDR calculator — enter CIDR notation and get network address, broadcast, subnet mask, wildcard mask, and IP range instantly in your browser. No data is stored. Supports multiple CIDRs separated by newlines.",
    category: "network",
    subgroup: "Network",
    tier: ToolTier.CLIENT,
    keywords: [
      "network",
      "cidr",
      "ip",
      "range",
      "calculator",
      "subnet",
      "ipv4",
      "notation",
      "netmask",
      "wildcard",
      "broadcast",
    ],
    ui: { outputRenderer: "json-tree" as const },
    examples: [
      {
        title: "Calculate a /24 private subnet",
        description:
          "Get network, broadcast, mask, and range for 192.168.1.0/24",
        input: "192.168.1.0/24",
        output:
          '{"ranges":[{"cidr":"192.168.1.0/24","networkAddress":"192.168.1.0","broadcastAddress":"192.168.1.255","firstIp":"192.168.1.0","lastIp":"192.168.1.255","totalAddresses":256,"subnetMask":"255.255.255.0","wildcardMask":"0.0.0.255"}]}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
