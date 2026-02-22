import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to extract IP addresses from"),
});

const outputSchema = z.object({
  ips: z.array(z.string()).describe("All extracted IP addresses"),
  ipv4: z.array(z.string()).describe("IPv4 addresses"),
  ipv6: z.array(z.string()).describe("IPv6 addresses"),
  count: z.number().describe("Total count"),
  unique: z.array(z.string()).describe("Unique IPs"),
});

const optionsSchema = z.object({
  unique: z.boolean().default(true).describe("Return only unique IPs"),
  includeIPv6: z.boolean().default(true).describe("Include IPv6 addresses"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

// IPv4 regex
const IPV4_REGEX =
  /\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;

// IPv6 regex (simplified)
const IPV6_REGEX =
  /(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}|(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}|(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}|(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:(?::[0-9a-fA-F]{1,4}){1,6}|:(?::[0-9a-fA-F]{1,4}){1,7}|::(?:[fF]{4}:)?(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/g;

/**
 * Extracts IP addresses from text.
 */
function execute(input: Input, options?: Options): Output {
  const uniqueOnly = options?.unique ?? true;
  const includeIPv6 = options?.includeIPv6 ?? true;

  const text = input.input;

  const ipv4Matches = text.match(IPV4_REGEX) || [];
  const ipv6Matches = includeIPv6 ? text.match(IPV6_REGEX) || [] : [];

  const ipv4 = [...new Set(ipv4Matches)];
  const ipv6 = [...new Set(ipv6Matches.map((ip) => ip.toLowerCase()))];

  let ips = [...ipv4Matches, ...ipv6Matches];
  const unique = [...new Set(ips.map((ip) => ip.toLowerCase()))];

  if (uniqueOnly) {
    ips = unique;
  }

  return {
    ips,
    ipv4,
    ipv6,
    count: ips.length,
    unique,
  };
}

/**
 * IP Address Extractor tool.
 * Extracts IP addresses from text.
 */
export const ipExtractor = defineTool({
  meta: {
    id: "text/ip-extractor",
    name: "IP Address Extractor",
    description:
      "Free online IP address extractor — find and extract IPv4 and IPv6 addresses from text instantly in your browser. No data is stored. Returns unique IPs, counts, and separates IPv4 from IPv6.",
    category: "text",
    subgroup: "Extraction",
    tier: ToolTier.CLIENT,
    keywords: ["ip", "extract", "address", "ipv4", "ipv6", "network"],
    examples: [
      {
        title: "Extract IPs from logs",
        description: "Find IP addresses in server log entries",
        input:
          "Connection from 192.168.1.1 refused. Retry from 10.0.0.5 succeeded.",
        output:
          '{"ips":["192.168.1.1","10.0.0.5"],"ipv4":["192.168.1.1","10.0.0.5"],"ipv6":[],"count":2,"unique":["192.168.1.1","10.0.0.5"]}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
