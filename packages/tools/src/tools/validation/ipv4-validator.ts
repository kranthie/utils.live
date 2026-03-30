import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("IPv4 address to validate"),
});
const outputSchema = z.object({
  output: z.string().describe("Validation result"),
  isValid: z.boolean(),
  errors: z.array(z.string()).optional(),
});

export const ipv4Validator = defineTool({
  meta: {
    id: "validation/ipv4-validator",
    name: "IPv4 Validator",
    description:
      "Free online IPv4 address validator — check if an IP address is properly formatted instantly in your browser. No data is stored. Validates octet ranges and identifies address type (public, private, loopback, multicast).",
    category: "validation",
    subgroup: "Format Validators",
    tier: ToolTier.CLIENT,
    keywords: [
      "ipv4",
      "ip",
      "address",
      "validate",
      "network",
      "internet",
      "protocol",
      "subnet",
    ],
    examples: [
      {
        title: "Valid Public IP",
        description: "Validate a public IPv4 address",
        input: "8.8.8.8",
        output: "Valid IPv4: 8.8.8.8\nType: Public",
      },
      {
        title: "Private IP",
        description: "Validate and classify a private network address",
        input: "192.168.1.1",
        output: "Valid IPv4: 192.168.1.1\nType: Private (Class C)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const ip = input.input.trim();
    const parts = ip.split(".");
    const errors: string[] = [];
    if (parts.length !== 4) errors.push("Must have exactly 4 octets");
    else {
      for (let i = 0; i < 4; i++) {
        const part = parts[i] ?? "";
        const n = parseInt(part, 10);
        if (isNaN(n) || n < 0 || n > 255)
          errors.push(`Octet ${i + 1} out of range (0-255)`);
        if (part !== String(n))
          errors.push(`Octet ${i + 1} has leading zeros or invalid format`);
      }
    }
    const isValid = errors.length === 0;
    if (isValid) {
      const octets = parts.map(Number);
      let type = "Public";
      const o0 = octets[0] ?? 0;
      const o1 = octets[1] ?? 0;
      if (o0 === 10) type = "Private (Class A)";
      else if (o0 === 172 && o1 >= 16 && o1 <= 31) type = "Private (Class B)";
      else if (o0 === 192 && o1 === 168) type = "Private (Class C)";
      else if (o0 === 127) type = "Loopback";
      else if (o0 >= 224 && o0 <= 239) type = "Multicast";
      else if (o0 === 0) type = "Current network";
      return { output: `Valid IPv4: ${ip}\nType: ${type}`, isValid: true };
    }
    return {
      output: `Invalid IPv4: ${errors.join("; ")}`,
      isValid: false,
      errors,
    };
  },
});
