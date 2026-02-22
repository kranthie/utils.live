import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("DOI to validate (e.g., '10.1000/xyz123')"),
});
const outputSchema = z.object({
  output: z.string().describe("Validation result"),
  isValid: z.boolean(),
  errors: z.array(z.string()).optional(),
});

export const doiValidator = defineTool({
  meta: {
    id: "validation/doi-validator",
    name: "DOI Validator",
    description:
      "Free online DOI validator — verify Digital Object Identifier format instantly in your browser. No data is stored. Validates the DOI prefix and suffix structure per the DOI specification.",
    category: "validation",
    subgroup: "Format Validators",
    tier: ToolTier.CLIENT,
    keywords: [
      "doi",
      "digital",
      "object",
      "identifier",
      "validate",
      "academic",
      "citation",
      "research",
      "publication",
    ],
    examples: [
      {
        title: "Valid DOI",
        description: "Validate a standard DOI identifier",
        input: "10.1038/nature12373",
        output:
          "Valid DOI: 10.1038/nature12373\nPrefix: 10.1038\nSuffix: nature12373",
      },
      {
        title: "DOI from URL",
        description: "Validate a DOI provided as a full URL",
        input: "https://doi.org/10.1000/xyz123",
        output: "Valid DOI: 10.1000/xyz123\nPrefix: 10.1000\nSuffix: xyz123",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    let doi = input.input.trim();
    // Strip common prefixes
    doi = doi.replace(/^https?:\/\/doi\.org\//, "").replace(/^doi:/, "");
    const re = /^10\.\d{4,9}\/[^\s]+$/;
    const isValid = re.test(doi);
    if (isValid) {
      const [prefix, ...suffixParts] = doi.split("/");
      const suffix = suffixParts.join("/");
      return {
        output: `Valid DOI: ${doi}\nPrefix: ${prefix}\nSuffix: ${suffix}`,
        isValid: true,
      };
    }
    const errors: string[] = [];
    if (!doi.startsWith("10.")) errors.push("DOI must start with '10.'");
    if (!doi.includes("/")) errors.push("DOI must contain a '/' separator");
    return {
      output: `Invalid DOI: ${errors.join("; ")}`,
      isValid: false,
      errors,
    };
  },
});
