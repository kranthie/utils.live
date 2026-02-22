import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("MAC address to validate"),
});
const outputSchema = z.object({
  output: z.string().describe("Validation result"),
  isValid: z.boolean(),
  errors: z.array(z.string()).optional(),
});

export const macAddressValidator = defineTool({
  meta: {
    id: "validation/mac-address-validator",
    name: "MAC Address Validator",
    description:
      "Free online MAC address validator — check if a MAC address is properly formatted instantly in your browser. No data is stored. Supports colon-separated, hyphen-separated, and dot-separated notation.",
    category: "validation",
    subgroup: "Format Validators",
    tier: ToolTier.CLIENT,
    keywords: [
      "mac",
      "address",
      "validate",
      "network",
      "ethernet",
      "hardware",
      "nic",
      "ieee",
    ],
    examples: [
      {
        title: "Colon-Separated MAC",
        description: "Validate a standard colon-separated MAC address",
        input: "00:1A:2B:3C:4D:5E",
        output: "Valid MAC address (colon-separated): 00:1A:2B:3C:4D:5E",
      },
      {
        title: "Cisco Format MAC",
        description: "Validate a Cisco-style dot-separated MAC address",
        input: "001A.2B3C.4D5E",
        output: "Valid MAC address (dot-separated): 001A.2B3C.4D5E",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const mac = input.input.trim();
    const formats = [
      { name: "colon-separated", re: /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/ },
      { name: "hyphen-separated", re: /^([0-9A-Fa-f]{2}-){5}[0-9A-Fa-f]{2}$/ },
      {
        name: "dot-separated",
        re: /^[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}$/,
      },
      { name: "no separator", re: /^[0-9A-Fa-f]{12}$/ },
    ];
    for (const fmt of formats) {
      if (fmt.re.test(mac)) {
        return {
          output: `Valid MAC address (${fmt.name}): ${mac}`,
          isValid: true,
        };
      }
    }
    return {
      output: "Invalid MAC address format",
      isValid: false,
      errors: [
        "Expected formats: XX:XX:XX:XX:XX:XX, XX-XX-XX-XX-XX-XX, XXXX.XXXX.XXXX, or XXXXXXXXXXXX",
      ],
    };
  },
});
