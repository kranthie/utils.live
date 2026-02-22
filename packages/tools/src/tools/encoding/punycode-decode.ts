import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("Punycode encoded string or domain to decode"),
});

const outputSchema = z.object({
  output: z.string().describe("Decoded Unicode text"),
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

function decodeDigit(cp: number): number {
  if (cp >= 48 && cp <= 57) return cp - 22; // 0-9 -> 26-35
  if (cp >= 65 && cp <= 90) return cp - 65; // A-Z -> 0-25
  if (cp >= 97 && cp <= 122) return cp - 97; // a-z -> 0-25
  throw new Error("Invalid Punycode digit");
}

function punycodeDecodeString(encoded: string): string {
  const output: number[] = [];
  let i = 0;
  let n = INITIAL_N;
  let bias = INITIAL_BIAS;

  // Find the last delimiter
  let basicEnd = encoded.lastIndexOf("-");
  if (basicEnd < 0) basicEnd = 0;

  // Copy basic characters
  for (let j = 0; j < basicEnd; j++) {
    const cp = encoded.charCodeAt(j);
    if (cp >= 128) throw new Error("Invalid basic character in Punycode");
    output.push(cp);
  }

  // Decode the extended characters
  let pos = basicEnd > 0 ? basicEnd + 1 : 0;

  while (pos < encoded.length) {
    const oldi = i;
    let w = 1;

    for (let k = BASE; ; k += BASE) {
      if (pos >= encoded.length) throw new Error("Invalid Punycode input");
      const digit = decodeDigit(encoded.charCodeAt(pos++));
      i += digit * w;
      const t = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias;
      if (digit < t) break;
      w *= BASE - t;
    }

    const out = output.length + 1;
    bias = adapt(i - oldi, out, oldi === 0);
    n += Math.floor(i / out);
    i %= out;

    output.splice(i, 0, n);
    i++;
  }

  return String.fromCodePoint(...output);
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
      const decoded = labels.map((label) => {
        if (label.toLowerCase().startsWith("xn--")) {
          return punycodeDecodeString(label.substring(4));
        }
        return label;
      });
      return { output: decoded.join(".") };
    }

    // Single label
    let punycode = trimmed;
    if (punycode.toLowerCase().startsWith("xn--")) {
      punycode = punycode.substring(4);
    }

    return { output: punycodeDecodeString(punycode) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to decode";
    throw createToolError({
      code: EXEC_FAILED,
      message: `Punycode decoding failed: ${msg}`,
    });
  }
}

export const punycodeDecode = defineTool({
  meta: {
    id: "encoding/punycode-decode",
    name: "Punycode Decode",
    description:
      "Free online Punycode decoder — convert Punycode-encoded internationalized domain names (IDN) back to Unicode text instantly in your browser. No data is stored. Handles xn-- prefixed labels and full domain names per RFC 3492.",
    category: "encoding",
    subgroup: "Text Encoding",
    tier: ToolTier.CLIENT,
    keywords: ["punycode", "idn", "domain", "internationalized", "decode"],
    examples: [
      {
        title: "Decode IDN Domain",
        description: "Decode a Punycode internationalized domain name",
        input: "xn--nxasmq6b.com",
        output: "βόλοσ.com",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
