import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("IPv4 address (e.g. '192.168.1.1')"),
});
const outputSchema = z.object({
  output: z.string().describe("Integer representation and details"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");

  const parts = text.split(".");
  if (parts.length !== 4)
    throw new Error("Invalid IPv4 address format. Expected: x.x.x.x");
  const octets = parts.map((p) => parseInt(p, 10));
  if (octets.some((o) => isNaN(o) || o < 0 || o > 255))
    throw new Error("Invalid octet value. Each octet must be 0-255.");

  const integer =
    ((octets[0]! << 24) |
      (octets[1]! << 16) |
      (octets[2]! << 8) |
      octets[3]!) >>>
    0;
  const hex = "0x" + integer.toString(16).padStart(8, "0").toUpperCase();
  const binary = octets.map((o) => o.toString(2).padStart(8, "0")).join(".");
  const octal = "0" + integer.toString(8);

  const result = {
    ip: text,
    integer,
    hex,
    binary,
    octal,
    octets,
  };

  return { output: JSON.stringify(result, null, 2) };
}

export const ipToInteger = defineTool({
  meta: {
    id: "network/ip-to-integer",
    name: "IP to Integer",
    description:
      "Free online IPv4 to integer converter — enter a dotted-decimal IP address and get the decimal integer, hex, binary, octal, and octet breakdown instantly in your browser. No data is stored.",
    category: "network",
    subgroup: "Network",
    tier: ToolTier.CLIENT,
    keywords: [
      "ip",
      "integer",
      "convert",
      "ipv4",
      "decimal",
      "binary",
      "hex",
      "octal",
    ],
    ui: { outputLanguage: "json" as const },
    examples: [
      {
        title: "Convert 192.168.1.1 to integer",
        description:
          "Get the decimal, hex, binary, and octal representations of an IPv4 address",
        input: "192.168.1.1",
        output:
          '{"output":"{\\n  \\"ip\\": \\"192.168.1.1\\",\\n  \\"integer\\": 3232235777,\\n  \\"hex\\": \\"0xC0A80101\\",\\n  \\"binary\\": \\"11000000.10101000.00000001.00000001\\",\\n  \\"octal\\": \\"030052000401\\",\\n  \\"octets\\": [\\n    192,\\n    168,\\n    1,\\n    1\\n  ]\\n}"}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
