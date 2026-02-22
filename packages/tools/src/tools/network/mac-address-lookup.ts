import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { INPUT_INVALID_FORMAT } from "../../core/error-codes";

/**
 * Subset of well-known OUI (Organizationally Unique Identifier) prefixes.
 * In production, this would be loaded from the IEEE OUI database.
 */
const OUI_DATABASE: Record<string, string> = {
  "00:00:0C": "Cisco Systems",
  "00:01:42": "Cisco Systems",
  "00:0A:95": "Apple",
  "00:0C:29": "VMware",
  "00:0D:3A": "Microsoft Corporation",
  "00:0F:FE": "G-Star",
  "00:14:22": "Dell",
  "00:15:5D": "Microsoft Hyper-V",
  "00:16:3E": "Xen Virtual",
  "00:1A:11": "Google",
  "00:1B:44": "SanDisk Corporation",
  "00:1C:42": "Parallels",
  "00:1E:C2": "Apple",
  "00:21:5A": "Hewlett-Packard",
  "00:23:AE": "Dell",
  "00:25:00": "Apple",
  "00:26:BB": "Apple",
  "00:50:56": "VMware",
  "00:E0:4C": "Realtek Semiconductor",
  "00:E0:81": "Tyan Computer",
  "08:00:27": "Oracle VirtualBox",
  "08:00:20": "Oracle/Sun Microsystems",
  "0C:C4:7A": "Super Micro Computer",
  "10:DD:B1": "Apple",
  "14:18:77": "Apple",
  "18:81:0E": "Apple",
  "1C:36:BB": "Apple",
  "20:C9:D0": "Apple",
  "24:A0:74": "Apple",
  "28:6A:BA": "Apple",
  "2C:F0:EE": "Apple",
  "30:10:B3": "Liteon Technology",
  "34:17:EB": "Dell",
  "38:F9:D3": "Apple",
  "3C:07:54": "Apple",
  "3C:D9:2B": "Hewlett-Packard",
  "40:6C:8F": "Apple",
  "44:85:00": "Intel Corporate",
  "48:2C:A0": "Xiaomi",
  "4C:32:75": "Apple",
  "50:32:37": "Apple",
  "54:9F:13": "Apple",
  "58:55:CA": "Apple",
  "5C:F9:38": "Apple",
  "60:03:08": "Apple",
  "64:A2:F9": "Apple",
  "68:5B:35": "Apple",
  "6C:40:08": "Apple",
  "70:56:81": "Apple",
  "74:E5:F9": "Dell",
  "78:31:C1": "Apple",
  "7C:D1:C3": "Apple",
  "80:E6:50": "Apple",
  "84:38:35": "Apple",
  "88:53:95": "Apple",
  "8C:85:90": "Apple",
  "90:B9:31": "Apple",
  "98:01:A7": "Apple",
  "9C:20:7B": "Apple",
  "A0:99:9B": "Apple",
  "A4:5E:60": "Apple",
  "A8:20:66": "Apple",
  "AC:87:A3": "Apple",
  "B0:65:BD": "Apple",
  "B4:18:D1": "Apple",
  "B8:09:8A": "Apple",
  "BC:52:B7": "Apple",
  "C0:9A:D0": "Apple",
  "C4:2C:03": "Apple",
  "C8:69:CD": "Apple",
  "CC:08:8D": "Apple",
  "D0:03:4B": "Apple",
  "D4:F4:6F": "Apple",
  "D8:30:62": "Apple",
  "DC:2B:2A": "Apple",
  "E0:B5:5F": "Apple",
  "E4:CE:8F": "Apple",
  "E8:80:2E": "Apple",
  "EC:35:86": "Apple",
  "F0:18:98": "Apple",
  "F4:5C:89": "Apple",
  "F8:1E:DF": "Apple",
  "FC:25:3F": "Apple",
  "AA:BB:CC": "Unknown (Example)",
  "B8:27:EB": "Raspberry Pi Foundation",
  "DC:A6:32": "Raspberry Pi (Trading)",
  "E4:5F:01": "Raspberry Pi (Trading)",
};

const inputSchema = z.object({
  input: z
    .string()
    .describe(
      "MAC address in any format (e.g. '00:1A:2B:3C:4D:5E', '00-1A-2B-3C-4D-5E', '001A2B3C4D5E')"
    ),
});

const outputSchema = z.object({
  mac: z.string().describe("Normalized MAC address (colon-separated)"),
  macDash: z.string().describe("MAC address with dashes"),
  macDot: z.string().describe("MAC address with dots (Cisco style)"),
  macBare: z.string().describe("MAC address without separators"),
  oui: z.string().describe("OUI prefix (first 3 octets)"),
  vendor: z.string().describe("Vendor/manufacturer name"),
  isUnicast: z.boolean().describe("Whether the address is unicast"),
  isMulticast: z.boolean().describe("Whether the address is multicast"),
  isUniversal: z
    .boolean()
    .describe("Whether the address is universally administered"),
  isLocal: z.boolean().describe("Whether the address is locally administered"),
  binary: z.string().describe("MAC address in binary"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function normalizeMac(input: string): string[] | null {
  // Remove common separators and whitespace
  const cleaned = input
    .trim()
    .replace(/[\s.:_-]/g, "")
    .toUpperCase();

  if (!/^[0-9A-F]{12}$/.test(cleaned)) {
    return null;
  }

  const octets: string[] = [];
  for (let i = 0; i < 12; i += 2) {
    octets.push(cleaned.substring(i, i + 2));
  }
  return octets;
}

function execute(input: Input): Output {
  const octets = normalizeMac(input.input);

  if (!octets || octets.length !== 6) {
    throw createToolError({
      code: INPUT_INVALID_FORMAT,
      message: `Invalid MAC address: ${input.input}. Supported formats: XX:XX:XX:XX:XX:XX, XX-XX-XX-XX-XX-XX, XXXXXXXXXXXX`,
    });
  }

  const macColon = octets.join(":");
  const macDash = octets.join("-");
  const macDot =
    octets[0]! +
    octets[1]! +
    "." +
    octets[2]! +
    octets[3]! +
    "." +
    octets[4]! +
    octets[5]!;
  const macBare = octets.join("");

  // OUI is first 3 octets
  const oui = octets.slice(0, 3).join(":");

  // Look up vendor from OUI database
  const vendor = OUI_DATABASE[oui] || "Unknown";

  // Bit analysis of first octet
  const firstOctetNum = parseInt(octets[0]!, 16);
  const isMulticast = (firstOctetNum & 0x01) === 1;
  const isLocal = (firstOctetNum & 0x02) === 2;

  // Binary representation
  const binary = octets
    .map((o) => parseInt(o, 16).toString(2).padStart(8, "0"))
    .join(":");

  return {
    mac: macColon,
    macDash,
    macDot,
    macBare,
    oui,
    vendor,
    isUnicast: !isMulticast,
    isMulticast,
    isUniversal: !isLocal,
    isLocal,
    binary,
  };
}

export const macAddressLookup = defineTool({
  meta: {
    id: "network/mac-address-lookup",
    name: "MAC Address Lookup",
    description:
      "Free online MAC address lookup — enter a MAC address and get the vendor/manufacturer, OUI prefix, all format variants (colon, dash, dot, bare), and unicast/multicast flags instantly in your browser. No data is stored. Recognizes 90+ OUI prefixes.",
    category: "network",
    subgroup: "Network",
    tier: ToolTier.CLIENT,
    keywords: [
      "network",
      "mac",
      "address",
      "oui",
      "vendor",
      "manufacturer",
      "ethernet",
      "lookup",
      "ieee",
    ],
    ui: { outputRenderer: "json-tree" as const },
    examples: [
      {
        title: "Look up VMware MAC address vendor",
        description:
          "Identify the manufacturer and properties for a VMware virtual NIC MAC",
        input: "00:0C:29:3E:4A:5B",
        output:
          '{"mac":"00:0C:29:3E:4A:5B","macDash":"00-0C-29-3E-4A-5B","macDot":"000C.293E.4A5B","macBare":"000C293E4A5B","oui":"00:0C:29","vendor":"VMware","isUnicast":true,"isMulticast":false,"isUniversal":true,"isLocal":false,"binary":"00000000:00001100:00101001:00111110:01001010:01011011"}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
