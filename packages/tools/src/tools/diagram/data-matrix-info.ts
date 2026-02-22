import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().min(1).describe("Text to analyze for Data Matrix encoding"),
});

const outputSchema = z.object({
  output: z.string().describe("Data Matrix encoding information"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const text = input.input.trim();
  if (!text) {
    throw new Error("Input text cannot be empty");
  }

  // Estimate symbol size
  const dataLen = text.length;
  let symbolSize: string;
  if (dataLen <= 3) symbolSize = "10x10";
  else if (dataLen <= 6) symbolSize = "12x12";
  else if (dataLen <= 10) symbolSize = "14x14";
  else if (dataLen <= 16) symbolSize = "16x16";
  else if (dataLen <= 25) symbolSize = "18x18";
  else if (dataLen <= 31) symbolSize = "20x20";
  else if (dataLen <= 43) symbolSize = "22x22";
  else if (dataLen <= 64) symbolSize = "24x24";
  else symbolSize = "26x26+";

  const lines = [
    "Data Matrix Barcode",
    "===================",
    "",
    "Data Matrix is a 2D matrix barcode used in:",
    "  - Electronic component marking",
    "  - Pharmaceutical packaging",
    "  - Postal services",
    "  - Industrial part marking",
    "",
    "Input text:",
    `  "${text}"`,
    `  Length: ${dataLen} characters`,
    "",
    "Encoding details:",
    `  Encoding mode: ${/^\d+$/.test(text) ? "Numeric" : /^[\x20-\x7e]+$/.test(text) ? "ASCII" : "Base256"}`,
    `  Estimated symbol size: ${symbolSize}`,
    `  Error correction: Reed-Solomon`,
    "",
    "Note: Full Data Matrix encoding requires complex Reed-Solomon ECC200 calculation.",
    "For production use, consider a dedicated barcode library.",
  ];

  return { output: lines.join("\n") };
}

export const dataMatrixInfo = defineTool({
  meta: {
    id: "diagram/data-matrix-info",
    name: "Data Matrix Info",
    description:
      "Free online Data Matrix info tool — analyze Data Matrix barcode parameters including capacity, encoding modes, and symbol sizes instantly in your browser. No data is stored. Displays error correction level, data length, and recommended matrix size.",
    category: "diagram",
    subgroup: "Barcodes",
    tier: ToolTier.CLIENT,
    keywords: ["barcode", "datamatrix", "2d", "matrix", "info"],
    examples: [
      {
        title: "Part Number",
        description: "Analyze Data Matrix encoding for a part number",
        input: "DMX-2024-ABCDEF",
        output:
          'Data Matrix Barcode\n===================\n\nData Matrix is a 2D matrix barcode used in:\n  - Electronic component marking\n  - Pharmaceutical packaging\n  - Postal services\n  - Industrial part marking\n\nInput text:\n  "DMX-2024-ABCDEF"\n  Length: 15 characters\n\nEncoding details:\n  Encoding mode: ASCII\n  Estimated symbol size: 16x16\n  Error correction: Reed-Solomon\n\nNote: Full Data Matrix encoding requires complex Reed-Solomon ECC200 calculation.\nFor production use, consider a dedicated barcode library.',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
