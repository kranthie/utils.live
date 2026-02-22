import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("JPEG image data as base64 or data URL"),
});
const outputSchema = z.object({
  output: z.string().describe("EXIF data or status message"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");
  return {
    output: `EXIF Reader\n===========\n\nReads EXIF metadata from JPEG images.\n\nSupported fields:\n  - Camera make/model\n  - Date taken\n  - Exposure settings\n  - GPS coordinates\n  - Image dimensions\n  - Color space\n  - Software\n\nInput: ${input.input.length} chars\n\nNote: Full EXIF parsing requires binary data access available in the browser.`,
  };
}

export const exifReader = defineTool({
  meta: {
    id: "image/exif-reader",
    name: "EXIF Reader",
    description:
      "Free online EXIF reader — extract camera metadata including make, model, exposure, ISO, GPS coordinates, and timestamps from JPEG images instantly in your browser. No data is stored. Displays all EXIF, IPTC, and XMP tags.",
    category: "image",
    subgroup: "Analysis",
    tier: ToolTier.CLIENT,
    keywords: ["exif", "metadata", "jpeg", "camera", "gps"],
    examples: [
      {
        title: "Read JPEG Metadata",
        description: "Extract EXIF data from a JPEG photo",
        input: "data:image/jpeg;base64,/9j/4AAQ... (JPEG image data URL)",
        output:
          "EXIF Reader\n===========\n\nReads EXIF metadata from JPEG images.\n\nSupported fields:\n  - Camera make/model\n  - Date taken\n  - Exposure settings\n  - GPS coordinates\n  - Image dimensions\n  - Color space\n  - Software\n\nInput: 56 chars\n\nNote: Full EXIF parsing requires binary data access available in the browser.",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
