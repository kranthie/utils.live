import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to extract phone numbers from"),
});

const outputSchema = z.object({
  phones: z.array(z.string()).describe("Extracted phone numbers"),
  count: z.number().describe("Number of phones found"),
  unique: z.array(z.string()).describe("Unique phone numbers"),
  normalized: z.array(z.string()).describe("Normalized (digits only)"),
});

const optionsSchema = z.object({
  unique: z.boolean().default(true).describe("Return only unique numbers"),
  normalize: z.boolean().default(false).describe("Return normalized numbers"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

// Various phone formats
const PHONE_PATTERNS = [
  /\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, // US format
  /\+?\d{1,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g, // International
  /\(\d{3}\)\s*\d{3}[-.\s]?\d{4}/g, // (XXX) XXX-XXXX
  /\d{3}[-.\s]\d{3}[-.\s]\d{4}/g, // XXX-XXX-XXXX
  /\d{10,15}/g, // Plain digits
];

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function isValidPhone(phone: string): boolean {
  const digits = normalizePhone(phone);
  // Must be between 7 and 15 digits
  return digits.length >= 7 && digits.length <= 15;
}

/**
 * Extracts phone numbers from text.
 */
function execute(input: Input, options?: Options): Output {
  const uniqueOnly = options?.unique ?? true;
  const normalize = options?.normalize ?? false;

  const text = input.input;
  const allMatches: string[] = [];

  for (const pattern of PHONE_PATTERNS) {
    const matches = text.match(pattern) || [];
    allMatches.push(...matches);
  }

  // Filter valid phones and deduplicate by normalized form
  const seenNormalized = new Set<string>();
  const validPhones: string[] = [];

  for (const phone of allMatches) {
    if (!isValidPhone(phone)) continue;

    const normalized = normalizePhone(phone);

    if (!seenNormalized.has(normalized)) {
      seenNormalized.add(normalized);
      validPhones.push(phone.trim());
    }
  }

  let phones = validPhones;
  const unique = [...new Set(phones)];
  const normalized = unique.map(normalizePhone);

  if (uniqueOnly) {
    phones = unique;
  }

  if (normalize) {
    phones = phones.map(normalizePhone);
  }

  return {
    phones,
    count: phones.length,
    unique,
    normalized,
  };
}

/**
 * Phone Extractor tool.
 * Extracts phone numbers from text.
 */
export const phoneExtractor = defineTool({
  meta: {
    id: "text/phone-extractor",
    name: "Phone Extractor",
    description:
      "Free online phone number extractor — find and extract phone numbers from text instantly in your browser. No data is stored. Recognizes US, international, and plain-digit formats with optional normalization.",
    category: "text",
    subgroup: "Extraction",
    tier: ToolTier.CLIENT,
    keywords: ["phone", "extract", "number", "telephone", "mobile"],
    examples: [
      {
        title: "Extract phone numbers from text",
        description: "Find phone numbers in various formats",
        input: "Call us at (555) 123-4567 or 555.987.6543 for support.",
        output:
          '{"phones":["(555) 123-4567","555.987.6543"],"count":2,"unique":["(555) 123-4567","555.987.6543"],"normalized":["5551234567","5559876543"]}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
