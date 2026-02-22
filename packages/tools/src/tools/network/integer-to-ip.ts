import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z
    .string()
    .describe(
      "Integer value to convert to IPv4 (e.g. '3232235777' or '0xC0A80101')"
    ),
});
const outputSchema = z.object({
  output: z.string().describe("IPv4 address and details"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");

  let num: number;
  if (text.startsWith("0x") || text.startsWith("0X")) {
    num = parseInt(text, 16);
  } else if (text.startsWith("0") && text.length > 1 && !text.includes(".")) {
    num = parseInt(text, 8);
  } else {
    num = parseInt(text, 10);
  }

  if (isNaN(num) || num < 0 || num > 4294967295) {
    throw new Error(
      "Invalid integer. Must be between 0 and 4294967295 (0xFFFFFFFF)."
    );
  }

  num = num >>> 0;
  const ip = [
    (num >>> 24) & 0xff,
    (num >>> 16) & 0xff,
    (num >>> 8) & 0xff,
    num & 0xff,
  ].join(".");

  const binary = [
    ((num >>> 24) & 0xff).toString(2).padStart(8, "0"),
    ((num >>> 16) & 0xff).toString(2).padStart(8, "0"),
    ((num >>> 8) & 0xff).toString(2).padStart(8, "0"),
    (num & 0xff).toString(2).padStart(8, "0"),
  ].join(".");

  const result = {
    integer: num,
    ip,
    hex: "0x" + num.toString(16).padStart(8, "0").toUpperCase(),
    binary,
  };

  return { output: JSON.stringify(result, null, 2) };
}

export const integerToIp = defineTool({
  meta: {
    id: "network/integer-to-ip",
    name: "Integer to IP",
    description:
      "Free online integer to IPv4 converter — enter a decimal, hex, or octal integer and get the dotted-decimal IP address, hex, and binary representation instantly in your browser. No data is stored. Supports 0x hex and 0 octal prefixes.",
    category: "network",
    subgroup: "Network",
    tier: ToolTier.CLIENT,
    keywords: [
      "ip",
      "integer",
      "convert",
      "ipv4",
      "decimal",
      "hex",
      "binary",
      "octal",
    ],
    ui: { outputLanguage: "json" as const },
    examples: [
      {
        title: "Convert 3232235777 to 192.168.1.1",
        description:
          "Convert a decimal integer to IPv4 dotted notation with hex and binary",
        input: "3232235777",
        output:
          '{"output":"{\\n  \\"integer\\": 3232235777,\\n  \\"ip\\": \\"192.168.1.1\\",\\n  \\"hex\\": \\"0xC0A80101\\",\\n  \\"binary\\": \\"11000000.10101000.00000001.00000001\\"\\n}"}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
