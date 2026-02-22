import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("IPv6 address to validate"),
});
const outputSchema = z.object({
  output: z.string().describe("Validation result"),
  isValid: z.boolean(),
  errors: z.array(z.string()).optional(),
});

export const ipv6Validator = defineTool({
  meta: {
    id: "validation/ipv6-validator",
    name: "IPv6 Validator",
    description:
      "Free online IPv6 address validator — check if an IPv6 address is properly formatted instantly in your browser. No data is stored. Validates full and abbreviated formats, and identifies address type (loopback, link-local, multicast).",
    category: "validation",
    subgroup: "Format Validators",
    tier: ToolTier.CLIENT,
    keywords: [
      "ipv6",
      "ip",
      "address",
      "validate",
      "network",
      "internet",
      "protocol",
      "dual-stack",
    ],
    examples: [
      {
        title: "Loopback Address",
        description: "Validate the IPv6 loopback address",
        input: "::1",
        output: "Valid IPv6: ::1\nType: Loopback",
      },
      {
        title: "Full IPv6 Address",
        description: "Validate a full global unicast IPv6 address",
        input: "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
        output:
          "Valid IPv6: 2001:0db8:85a3:0000:0000:8a2e:0370:7334\nType: Global Unicast",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const ip = input.input.trim();
    // Full IPv6 regex
    const re =
      /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]+|::(ffff(:0{1,4})?:)?((25[0-5]|(2[0-4]|1?[0-9])?[0-9])\.){3}(25[0-5]|(2[0-4]|1?[0-9])?[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1?[0-9])?[0-9])\.){3}(25[0-5]|(2[0-4]|1?[0-9])?[0-9]))$/;
    const isValid = re.test(ip);
    if (isValid) {
      let type = "Global Unicast";
      const lower = ip.toLowerCase();
      if (lower === "::1") type = "Loopback";
      else if (lower === "::") type = "Unspecified";
      else if (lower.startsWith("fe80")) type = "Link-local";
      else if (lower.startsWith("fc") || lower.startsWith("fd"))
        type = "Unique local";
      else if (lower.startsWith("ff")) type = "Multicast";
      return { output: `Valid IPv6: ${ip}\nType: ${type}`, isValid: true };
    }
    return {
      output: "Invalid IPv6 address format",
      isValid: false,
      errors: ["Does not match IPv6 format"],
    };
  },
});
