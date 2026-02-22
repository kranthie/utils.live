import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().min(1).describe("Text to analyze for PDF417 encoding"),
});

const outputSchema = z.object({
  output: z.string().describe("PDF417 encoding information"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const text = input.input.trim();
  if (!text) {
    throw new Error("Input text cannot be empty");
  }

  const lines = [
    "PDF417 Barcode",
    "==============",
    "",
    "PDF417 is a stacked linear barcode format used in:",
    "  - ID cards and driver's licenses",
    "  - Airline boarding passes",
    "  - Shipping labels",
    "  - Government documents",
    "",
    "Input text:",
    `  "${text}"`,
    `  Length: ${text.length} characters`,
    "",
    "Encoding details:",
    `  Mode: ${/^\d+$/.test(text) ? "Numeric" : /^[\x20-\x7e]+$/.test(text) ? "Text" : "Byte"}`,
    `  Error correction level: Auto (level 2-5 based on data size)`,
    `  Estimated codewords: ~${Math.ceil(text.length * 1.2)}`,
    "",
    "Note: Full PDF417 encoding requires complex codeword calculation.",
    "For production use, consider a dedicated barcode library.",
  ];

  return { output: lines.join("\n") };
}

export const pdf417Info = defineTool({
  meta: {
    id: "diagram/pdf417-info",
    name: "PDF417 Info",
    description:
      "Free online PDF417 info tool — analyze PDF417 barcode parameters including data capacity, encoding modes, and error correction levels instantly in your browser. No data is stored. Displays symbol dimensions and character count.",
    category: "diagram",
    subgroup: "Barcodes",
    tier: ToolTier.CLIENT,
    keywords: ["barcode", "pdf417", "2d", "stacked", "info"],
    examples: [
      {
        title: "ID Card Data",
        description: "Analyze PDF417 encoding for ID card data",
        input: "John Doe, DOB: 1990-01-15, ID: 123456789",
        output:
          'PDF417 Barcode\n==============\n\nPDF417 is a stacked linear barcode format used in:\n  - ID cards and driver\'s licenses\n  - Airline boarding passes\n  - Shipping labels\n  - Government documents\n\nInput text:\n  "John Doe, DOB: 1990-01-15, ID: 123456789"\n  Length: 40 characters\n\nEncoding details:\n  Mode: Text\n  Error correction level: Auto (level 2-5 based on data size)\n  Estimated codewords: ~48\n\nNote: Full PDF417 encoding requires complex codeword calculation.\nFor production use, consider a dedicated barcode library.',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
