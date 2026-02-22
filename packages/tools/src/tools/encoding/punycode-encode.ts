import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z
    .string()
    .describe("Unicode domain name or text to encode to Punycode"),
});

const outputSchema = z.object({
  output: z.string().describe("Punycode encoded string"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

// Punycode parameters (RFC 3492)
const BASE = 36;
const TMIN = 1;
const TMAX = 26;
const SKEW = 38;
const DAMP = 700;
const INITIAL_BIAS = 72;
const INITIAL_N = 128;

function adapt(delta: number, numPoints: number, firstTime: boolean): number {
  delta = firstTime ? Math.floor(delta / DAMP) : Math.floor(delta / 2);
  delta += Math.floor(delta / numPoints);
  let k = 0;
  while (delta > ((BASE - TMIN) * TMAX) / 2) {
    delta = Math.floor(delta / (BASE - TMIN));
    k += BASE;
  }
  return k + Math.floor(((BASE - TMIN + 1) * delta) / (delta + SKEW));
}

function encodeDigit(d: number): string {
  return String.fromCharCode(d + (d < 26 ? 97 : 22));
}

function punycodeEncodeString(input: string): string {
  const codePoints = Array.from(input).map((c) => c.codePointAt(0)!);
  const basicChars = codePoints.filter((cp) => cp < 128);
  const output: string[] = basicChars.map((cp) => String.fromCharCode(cp));

  let handledCount = basicChars.length;
  const basicLength = basicChars.length;

  if (basicLength > 0) {
    output.push("-");
  }

  let n = INITIAL_N;
  let delta = 0;
  let bias = INITIAL_BIAS;

  while (handledCount < codePoints.length) {
    // Find the minimum code point >= n
    let m = Infinity;
    for (const cp of codePoints) {
      if (cp >= n && cp < m) {
        m = cp;
      }
    }

    delta += (m - n) * (handledCount + 1);
    n = m;

    for (const cp of codePoints) {
      if (cp < n) {
        delta++;
      } else if (cp === n) {
        let q = delta;
        for (let k = BASE; ; k += BASE) {
          const t = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias;
          if (q < t) break;
          output.push(encodeDigit(t + ((q - t) % (BASE - t))));
          q = Math.floor((q - t) / (BASE - t));
        }
        output.push(encodeDigit(q));
        bias = adapt(delta, handledCount + 1, handledCount === basicLength);
        delta = 0;
        handledCount++;
      }
    }
    delta++;
    n++;
  }

  return output.join("");
}

function execute(input: Input): Output {
  try {
    const trimmed = input.input.trim();
    if (!trimmed) {
      throw new Error("Input cannot be empty");
    }

    // Check if it's a domain name (contains dots)
    if (trimmed.includes(".")) {
      const labels = trimmed.split(".");
      const encoded = labels.map((label) => {
        // Check if label has non-ASCII characters
        const hasNonAscii = Array.from(label).some(
          (c) => c.codePointAt(0)! >= 128
        );
        if (hasNonAscii) {
          return "xn--" + punycodeEncodeString(label.toLowerCase());
        }
        return label;
      });
      return { output: encoded.join(".") };
    }

    // Single label / text
    return { output: "xn--" + punycodeEncodeString(trimmed) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to encode";
    throw createToolError({
      code: EXEC_FAILED,
      message: `Punycode encoding failed: ${msg}`,
    });
  }
}

export const punycodeEncode = defineTool({
  meta: {
    id: "encoding/punycode-encode",
    name: "Punycode Encode",
    description:
      "Free online Punycode encoder — convert Unicode domain names and text to Punycode (IDN) encoding instantly in your browser. No data is stored. Adds xn-- prefixes to labels with non-ASCII characters per RFC 3492.",
    category: "encoding",
    subgroup: "Text Encoding",
    tier: ToolTier.CLIENT,
    keywords: ["punycode", "idn", "domain", "internationalized", "encode"],
    examples: [
      {
        title: "Encode Unicode Domain",
        description: "Encode a domain with Unicode characters to Punycode",
        input: "\u00fc\u00f6\u00e4.com",
        output: "xn--4ca9ar.com",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
