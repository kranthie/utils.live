import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  type: z
    .enum(["ipv4", "ipv6", "ipv4-cidr", "ipv6-cidr", "any"])
    .default("any")
    .describe("IP address type"),
});

const outputSchema = z.object({
  output: z.string().describe("IP regex pattern and description"),
  pattern: z.string().describe("The regex pattern"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

const PATTERNS: Record<string, { pattern: string; desc: string }> = {
  ipv4: {
    pattern:
      "^(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$",
    desc: "IPv4 address (e.g., 192.168.1.1)",
  },
  ipv6: {
    pattern: "^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$",
    desc: "IPv6 address full form (e.g., 2001:0db8:85a3:0000:0000:8a2e:0370:7334)",
  },
  "ipv4-cidr": {
    pattern:
      "^(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\/(?:3[0-2]|[12]?\\d)$",
    desc: "IPv4 CIDR notation (e.g., 192.168.1.0/24)",
  },
  "ipv6-cidr": {
    pattern:
      "^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\\/(?:12[0-8]|1[01]\\d|\\d{1,2})$",
    desc: "IPv6 CIDR notation",
  },
  any: {
    pattern:
      "(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)|(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}",
    desc: "Matches either IPv4 or IPv6 addresses",
  },
};

function execute(input: Input): Output {
  const p = PATTERNS[input.type]!;
  return {
    output: `IP Regex (${input.type}):\n\n${p.pattern}\n\n${p.desc}`,
    pattern: p.pattern,
  };
}

export const ipRegex = defineTool({
  meta: {
    id: "regex/ip-regex",
    name: "IP Address Regex",
    description:
      "Free online IP address regex generator — create validation patterns for IPv4, IPv6, and CIDR notation instantly in your browser. No data is stored. Supports strict octet validation and subnet mask patterns.",
    category: "regex",
    subgroup: "Pattern Library",
    tier: ToolTier.CLIENT,
    keywords: [
      "regex",
      "ip",
      "ipv4",
      "ipv6",
      "address",
      "network",
      "validate",
      "subnet",
      "cidr",
    ],
    examples: [
      {
        title: "IPv4 address validation pattern",
        description: "Get the regex pattern for validating IPv4 addresses",
        input: "ipv4",
        output:
          "IP Regex (ipv4):\n\n^(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$\n\nIPv4 address (e.g., 192.168.1.1)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
