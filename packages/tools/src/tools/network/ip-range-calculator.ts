import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { INPUT_INVALID_FORMAT } from "../../core/error-codes";

const inputSchema = z.object({
  input: z
    .string()
    .describe(
      "IP range in one of: CIDR (10.0.0.0/24), dash range (10.0.0.1-10.0.0.254), or start and end IPs on separate lines"
    ),
});

const outputSchema = z.object({
  startIp: z.string().describe("First IP in range"),
  endIp: z.string().describe("Last IP in range"),
  totalAddresses: z.number().describe("Total addresses in the range"),
  cidrs: z
    .array(z.string())
    .describe("CIDR blocks that cover this range exactly"),
  ipCount: z.number().describe("Number of individual IPs"),
  isSubnet: z
    .boolean()
    .describe("Whether the range aligns to a single CIDR block"),
  startIpDecimal: z.number().describe("Start IP as decimal number"),
  endIpDecimal: z.number().describe("End IP as decimal number"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function parseIpToNumber(ip: string): number {
  const parts = ip.trim().split(".").map(Number);
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

/**
 * Convert an IP range to the minimal set of CIDR blocks.
 */
function rangeToCidrs(start: number, end: number): string[] {
  const cidrs: string[] = [];
  let current = start;

  while (current <= end) {
    // Find the largest block starting at current that fits within [current, end]
    let maxBits = 32;

    // Find how many trailing zeros in current address
    if (current !== 0) {
      let temp = current;
      let trailingZeros = 0;
      while ((temp & 1) === 0 && trailingZeros < 32) {
        trailingZeros++;
        temp >>>= 1;
      }
      maxBits = 32 - trailingZeros;
    } else {
      maxBits = 0;
    }

    // Find the largest prefix that fits within the remaining range
    while (maxBits > 0) {
      const mask = cidrToMask(maxBits);
      const blockEnd = (current | (~mask >>> 0)) >>> 0;
      if (blockEnd <= end) break;
      maxBits++;
    }

    const mask = cidrToMask(maxBits);
    const blockEnd = (current | (~mask >>> 0)) >>> 0;
    cidrs.push(`${numberToIp(current)}/${maxBits}`);

    if (blockEnd === 0xffffffff) break;
    current = (blockEnd + 1) >>> 0;
  }

  return cidrs;
}

function execute(input: Input): Output {
  const trimmed = input.input.trim();

  let startNum: number;
  let endNum: number;

  // Try CIDR notation
  const cidrMatch = trimmed.match(
    /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/
  );
  if (cidrMatch) {
    const ip = parseIpToNumber(cidrMatch[1]!);
    const cidr = parseInt(cidrMatch[2]!, 10);
    if (cidr < 0 || cidr > 32) {
      throw createToolError({
        code: INPUT_INVALID_FORMAT,
        message: `Invalid CIDR prefix: /${cidr}`,
      });
    }
    const mask = cidrToMask(cidr);
    startNum = (ip & mask) >>> 0;
    endNum = (startNum | (~mask >>> 0)) >>> 0;
  }
  // Try dash range: 10.0.0.1 - 10.0.0.254 or 10.0.0.1-10.0.0.254
  else if (trimmed.includes("-")) {
    const parts = trimmed.split("-").map((p) => p.trim());
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw createToolError({
        code: INPUT_INVALID_FORMAT,
        message: "Invalid range format. Use: startIP - endIP",
      });
    }
    startNum = parseIpToNumber(parts[0]);
    endNum = parseIpToNumber(parts[1]);
  }
  // Try two IPs on separate lines
  else {
    const lines = trimmed
      .split(/\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 2) {
      startNum = parseIpToNumber(lines[0]!);
      endNum = parseIpToNumber(lines[1]!);
    } else {
      throw createToolError({
        code: INPUT_INVALID_FORMAT,
        message:
          "Invalid input. Use CIDR notation (10.0.0.0/24), dash range (10.0.0.1-10.0.0.254), or two IPs on separate lines.",
      });
    }
  }

  if (startNum > endNum) {
    const temp = startNum;
    startNum = endNum;
    endNum = temp;
  }

  const totalAddresses = endNum - startNum + 1;
  const cidrs = rangeToCidrs(startNum, endNum);

  // Check if range is a single CIDR block
  const isSubnet = cidrs.length === 1;

  return {
    startIp: numberToIp(startNum),
    endIp: numberToIp(endNum),
    totalAddresses,
    cidrs,
    ipCount: totalAddresses,
    isSubnet,
    startIpDecimal: startNum,
    endIpDecimal: endNum,
  };
}

export const ipRangeCalculator = defineTool({
  meta: {
    id: "network/ip-range-calculator",
    name: "IP Range Calculator",
    description:
      "Free online IP range calculator — enter CIDR, dash range, or start/end IPs and get total addresses, minimal CIDR blocks, and decimal values instantly in your browser. No data is stored. Detects if the range aligns to a single subnet.",
    category: "network",
    subgroup: "Network",
    tier: ToolTier.CLIENT,
    keywords: [
      "network",
      "ip",
      "range",
      "calculator",
      "cidr",
      "address",
      "ipv4",
      "start",
      "end",
    ],
    ui: { outputRenderer: "json-tree" as const },
    examples: [
      {
        title: "Calculate range for a /24 CIDR block",
        description:
          "Get start IP, end IP, total addresses, and CIDR blocks for 10.0.0.0/24",
        input: "10.0.0.0/24",
        output:
          '{"startIp":"10.0.0.0","endIp":"10.0.0.255","totalAddresses":256,"cidrs":["10.0.0.0/24"],"ipCount":256,"isSubnet":true,"startIpDecimal":167772160,"endIpDecimal":167772415}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
