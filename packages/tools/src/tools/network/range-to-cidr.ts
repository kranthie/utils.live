import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z
    .string()
    .describe(
      "IP range (e.g. '192.168.1.0 - 192.168.1.255' or start and end on separate lines)"
    ),
});
const outputSchema = z.object({
  output: z.string().describe("CIDR blocks covering the range"),
});

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

function rangeToCidrs(start: number, end: number): string[] {
  const cidrs: string[] = [];
  let current = start;

  while (current <= end) {
    let maxBits = 32;
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

    while (maxBits > 0) {
      const mask = maxBits === 0 ? 0 : (~0 << (32 - maxBits)) >>> 0;
      const blockEnd = (current | (~mask >>> 0)) >>> 0;
      if (blockEnd <= end) break;
      maxBits++;
    }

    const mask = maxBits === 0 ? 0 : (~0 << (32 - maxBits)) >>> 0;
    const blockEnd = (current | (~mask >>> 0)) >>> 0;
    cidrs.push(`${numToIp(current)}/${maxBits}`);

    if (blockEnd === 0xffffffff) break;
    current = (blockEnd + 1) >>> 0;
  }

  return cidrs;
}

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");

  let startNum: number, endNum: number;

  if (text.includes("-")) {
    const parts = text.split("-").map((p) => p.trim());
    if (parts.length !== 2 || !parts[0] || !parts[1])
      throw new Error("Invalid range format. Use: startIP - endIP");
    startNum = parseIp(parts[0]);
    endNum = parseIp(parts[1]);
  } else {
    const lines = text
      .split(/\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 2) {
      startNum = parseIp(lines[0]!);
      endNum = parseIp(lines[1]!);
    } else {
      throw new Error("Provide IP range as 'start - end' or on separate lines");
    }
  }

  if (startNum > endNum) {
    const t = startNum;
    startNum = endNum;
    endNum = t;
  }

  const cidrs = rangeToCidrs(startNum, endNum);
  const result = {
    startIp: numToIp(startNum),
    endIp: numToIp(endNum),
    totalAddresses: endNum - startNum + 1,
    cidrBlocks: cidrs,
    blockCount: cidrs.length,
  };

  return { output: JSON.stringify(result, null, 2) };
}

export const rangeToCidr = defineTool({
  meta: {
    id: "network/range-to-cidr",
    name: "Range to CIDR",
    description:
      "Free online IP range to CIDR converter — enter a start-end IP range and get the minimal set of CIDR blocks that cover it exactly, instantly in your browser. No data is stored. Supports dash-separated or newline-separated ranges.",
    category: "network",
    subgroup: "Network",
    tier: ToolTier.CLIENT,
    keywords: [
      "range",
      "cidr",
      "ip",
      "convert",
      "network",
      "subnet",
      "aggregate",
    ],
    ui: { outputLanguage: "json" as const },
    examples: [
      {
        title: "Convert 192.168.1.0-255 range to CIDR",
        description:
          "Get the minimal CIDR block for a full /24 range of addresses",
        input: "192.168.1.0 - 192.168.1.255",
        output:
          '{"output":"{\\n  \\"startIp\\": \\"192.168.1.0\\",\\n  \\"endIp\\": \\"192.168.1.255\\",\\n  \\"totalAddresses\\": 256,\\n  \\"cidrBlocks\\": [\\n    \\"192.168.1.0/24\\"\\n  ],\\n  \\"blockCount\\": 1\\n}"}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
