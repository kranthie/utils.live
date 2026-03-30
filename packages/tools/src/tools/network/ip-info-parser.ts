import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("IPv4 or IPv6 address to analyze"),
});
const outputSchema = z.object({
  output: z.string().describe("IP address information"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");

  // Check if IPv4
  const v4Match = text.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4Match) {
    const octets = [
      parseInt(v4Match[1]!, 10),
      parseInt(v4Match[2]!, 10),
      parseInt(v4Match[3]!, 10),
      parseInt(v4Match[4]!, 10),
    ];
    if (octets.some((o) => o < 0 || o > 255))
      throw new Error("Invalid IPv4 octet values");

    const num =
      ((octets[0]! << 24) |
        (octets[1]! << 16) |
        (octets[2]! << 8) |
        octets[3]!) >>>
      0;
    const first = octets[0]!;
    const second = octets[1]!;

    let ipClass = "A";
    if (first >= 128 && first < 192) ipClass = "B";
    else if (first >= 192 && first < 224) ipClass = "C";
    else if (first >= 224 && first < 240) ipClass = "D (Multicast)";
    else if (first >= 240) ipClass = "E (Reserved)";

    const isPrivate =
      first === 10 ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168);
    const isLoopback = first === 127;
    const isLinkLocal = first === 169 && second === 254;
    const isMulticast = first >= 224 && first <= 239;
    const isBroadcast = num === 0xffffffff;
    const isUnspecified = num === 0;

    let type = "Public";
    if (isPrivate) type = "Private (RFC 1918)";
    else if (isLoopback) type = "Loopback";
    else if (isLinkLocal) type = "Link-Local (APIPA)";
    else if (isMulticast) type = "Multicast";
    else if (isBroadcast) type = "Broadcast";
    else if (isUnspecified) type = "Unspecified";

    const binary = octets.map((o) => o.toString(2).padStart(8, "0")).join(".");

    const result = {
      ip: text,
      version: "IPv4",
      type,
      class: ipClass,
      isPrivate,
      isLoopback,
      isLinkLocal,
      isMulticast,
      isBroadcast,
      isUnspecified,
      decimal: num,
      hex: "0x" + num.toString(16).padStart(8, "0").toUpperCase(),
      binary,
      octets,
      reversePtr: [...octets].reverse().join(".") + ".in-addr.arpa",
    };
    return { output: JSON.stringify(result, null, 2) };
  }

  // Check if IPv6
  const isV6 = text.includes(":") && /^[0-9a-fA-F:]+$/.test(text);
  if (isV6) {
    let expanded: string;
    if (text.includes("::")) {
      const parts = text.split("::");
      const left = parts[0] ? parts[0].split(":") : [];
      const right = parts[1] ? parts[1].split(":") : [];
      const missing = 8 - left.length - right.length;
      expanded = [
        ...left,
        ...Array.from({ length: missing }, (): string => "0000"),
        ...right,
      ]
        .map((g: string) => g.padStart(4, "0"))
        .join(":");
    } else {
      const groups = text.split(":");
      expanded = groups.map((g: string) => g.padStart(4, "0")).join(":");
    }

    const isLoopback = text === "::1";
    const isUnspecified = text === "::";
    const isLinkLocal = text.toLowerCase().startsWith("fe80:");
    const isMulticast = text.toLowerCase().startsWith("ff");
    const isULA = /^f[cd]/i.test(text);
    const is6to4 = text.startsWith("2002:");

    let type = "Global Unicast";
    if (isLoopback) type = "Loopback";
    else if (isUnspecified) type = "Unspecified";
    else if (isLinkLocal) type = "Link-Local";
    else if (isMulticast) type = "Multicast";
    else if (isULA) type = "Unique Local Address (ULA)";
    else if (is6to4) type = "6to4 Tunnel";

    const result = {
      ip: text,
      version: "IPv6",
      expanded,
      type,
      isLoopback,
      isUnspecified,
      isLinkLocal,
      isMulticast,
      isULA,
      is6to4,
      totalBits: 128,
    };
    return { output: JSON.stringify(result, null, 2) };
  }

  throw new Error("Invalid IP address. Provide a valid IPv4 or IPv6 address.");
}

export const ipInfoParser = defineTool({
  meta: {
    id: "network/ip-info-parser",
    name: "IP Info Parser",
    description:
      "Free online IP address analyzer — enter an IPv4 or IPv6 address and get version, type (private/public/loopback/multicast), class, decimal, hex, binary, and reverse PTR instantly in your browser. No data is stored.",
    category: "network",
    subgroup: "Network",
    tier: ToolTier.CLIENT,
    keywords: [
      "ip",
      "info",
      "parse",
      "analyze",
      "ipv4",
      "ipv6",
      "type",
      "class",
      "private",
      "public",
      "loopback",
      "ptr",
    ],
    ui: { outputLanguage: "json" as const },
    examples: [
      {
        title: "Analyze 192.168.1.1 private address",
        description:
          "Get type, class, decimal, binary, and reverse PTR for a private IPv4 address",
        input: "192.168.1.1",
        output:
          '{"output":"{\\n  \\"ip\\": \\"192.168.1.1\\",\\n  \\"version\\": \\"IPv4\\",\\n  \\"type\\": \\"Private (RFC 1918)\\",\\n  \\"class\\": \\"C\\",\\n  \\"isPrivate\\": true,\\n  \\"isLoopback\\": false,\\n  \\"isLinkLocal\\": false,\\n  \\"isMulticast\\": false,\\n  \\"isBroadcast\\": false,\\n  \\"isUnspecified\\": false,\\n  \\"decimal\\": 3232235777,\\n  \\"hex\\": \\"0xC0A80101\\",\\n  \\"binary\\": \\"11000000.10101000.00000001.00000001\\",\\n  \\"octets\\": [\\n    192,\\n    168,\\n    1,\\n    1\\n  ],\\n  \\"reversePtr\\": \\"1.1.168.192.in-addr.arpa\\"\\n}"}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
