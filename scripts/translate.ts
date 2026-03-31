#!/usr/bin/env tsx
/**
 * AI Translation Pipeline for utils.live
 *
 * Translates apps/web/messages/en.json to a target locale using the Anthropic API.
 *
 * Usage:
 *   pnpm translate --locale es      # Translate to Spanish
 *   pnpm translate --locale fr      # Translate to French
 *   pnpm translate --locale de      # Translate to German
 *
 * Requirements:
 *   ANTHROPIC_API_KEY environment variable must be set.
 *
 * Strings flagged for human review (marked with "[REVIEW]" prefix in the output):
 *   - Brand names (e.g. "utils.live")
 *   - Proper nouns and product names
 *   ICU plural/select patterns are preserved as-is — only the surrounding text is translated.
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------

function parseArgs(): { locale: string } {
  const args = process.argv.slice(2);
  const localeIndex = args.indexOf("--locale");
  if (localeIndex === -1 || !args[localeIndex + 1]) {
    console.error("Usage: pnpm translate --locale <locale-code>");
    console.error("Example: pnpm translate --locale es");
    process.exit(1);
  }
  const locale = args[localeIndex + 1].trim();
  if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(locale)) {
    console.error(
      `Invalid locale format: "${locale}". Expected e.g. "es", "fr", "de", "pt-BR"`
    );
    process.exit(1);
  }
  return { locale };
}

// ---------------------------------------------------------------------------
// Nested JSON helpers
// ---------------------------------------------------------------------------

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

/**
 * Flatten a nested JSON object into dot-notation key → value pairs.
 * Only leaf string values are included; non-string leaves are passed through unchanged.
 */
function flattenStrings(obj: JsonObject, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      result[path] = value;
    } else if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      Object.assign(result, flattenStrings(value, path));
    }
  }
  return result;
}

/**
 * Reconstruct nested JSON from flat dot-notation pairs, merging with the original
 * structure to preserve non-string values.
 */
function unflatten(
  translated: Record<string, string>,
  original: JsonObject
): JsonObject {
  const result = JSON.parse(JSON.stringify(original)) as unknown as JsonObject; // deep clone
  for (const [dotPath, value] of Object.entries(translated)) {
    const parts = dotPath.split(".");
    let node: JsonObject = result;
    for (let i = 0; i < parts.length - 1; i++) {
      node = node[parts[i]] as JsonObject;
    }
    node[parts[parts.length - 1]] = value;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Anthropic API call
// ---------------------------------------------------------------------------

const LOCALE_NAMES: Record<string, string> = {
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  "pt-BR": "Brazilian Portuguese",
  ja: "Japanese",
  zh: "Simplified Chinese",
  "zh-TW": "Traditional Chinese",
  ko: "Korean",
  ru: "Russian",
  ar: "Arabic",
  nl: "Dutch",
  pl: "Polish",
  tr: "Turkish",
  sv: "Swedish",
  da: "Danish",
  fi: "Finnish",
  nb: "Norwegian Bokmål",
  cs: "Czech",
  hu: "Hungarian",
  ro: "Romanian",
  uk: "Ukrainian",
};

function getLocaleName(locale: string): string {
  return LOCALE_NAMES[locale] ?? locale;
}

interface AnthropicMessage {
  content: Array<{ type: string; text: string }>;
}

async function translateBatch(
  strings: Record<string, string>,
  locale: string,
  apiKey: string
): Promise<Record<string, string>> {
  const localeName = getLocaleName(locale);
  const inputJson = JSON.stringify(strings, null, 2);

  const systemPrompt = `You are a professional software localization expert specializing in developer tools.
You will translate UI strings from English to ${localeName} for a developer utilities website called "utils.live".

CRITICAL RULES:
1. Return ONLY a valid JSON object with the exact same keys as the input — no explanation, no markdown fences.
2. Translate only the VALUES, never the keys.
3. ICU message format placeholders like {count}, {name}, {toolCountLabel}, etc. must be preserved EXACTLY as-is (including braces and content).
4. ICU plural/select patterns like {count, plural, one {# result} other {# results}} must be preserved structurally — translate only the human-readable text parts inside, keeping ICU syntax intact.
5. HTML tags like <strong>, <a href=...> must be preserved exactly.
6. Do NOT translate: the brand name "utils.live", programming terms used as-is (JSON, CSS, JWT, UUID, etc.), keyboard shortcut text (Cmd, Ctrl, Enter, etc.).
7. For strings containing "utils.live" or other brand/product names, prepend "[REVIEW] " to the translated value so a human can verify.
8. Match the tone: concise, technical, professional. Avoid overly formal language.`;

  const userPrompt = `Translate all values in this JSON from English to ${localeName}.
Remember: same keys, translated values only, preserve ICU patterns exactly.

${inputJson}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-6",
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as AnthropicMessage;
  const rawText = data.content[0]?.text ?? "";

  // Strip markdown fences if model wraps in ```json ... ```
  const cleaned = rawText
    .replace(/^```(?:json)?\n?/m, "")
    .replace(/\n?```$/m, "")
    .trim();

  try {
    return JSON.parse(cleaned) as Record<string, string>;
  } catch {
    throw new Error(
      `Failed to parse translation response as JSON:\n${cleaned.slice(0, 500)}`
    );
  }
}

// ---------------------------------------------------------------------------
// Chunking to stay within token limits
// ---------------------------------------------------------------------------

const CHUNK_SIZE = 80; // strings per API call

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { locale } = parseArgs();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is not set.");
    console.error("Set it with: export ANTHROPIC_API_KEY=sk-ant-...");
    process.exit(1);
  }

  const inputPath = resolve(ROOT, "apps/web/messages/en.json");
  const outputPath = resolve(ROOT, `apps/web/messages/${locale}.json`);

  console.log(`Reading source: ${inputPath}`);
  const source = JSON.parse(
    readFileSync(inputPath, "utf-8")
  ) as unknown as JsonObject;

  const strings = flattenStrings(source);
  const entries = Object.entries(strings);
  console.log(`Found ${entries.length} translatable strings`);

  const chunks = chunk(entries, CHUNK_SIZE);
  console.log(
    `Translating to ${getLocaleName(locale)} (${locale}) in ${chunks.length} batch(es)...`
  );

  const allTranslated: Record<string, string> = {};

  for (let i = 0; i < chunks.length; i++) {
    const batchObj = Object.fromEntries(chunks[i]);
    console.log(
      `  Batch ${i + 1}/${chunks.length} (${chunks[i].length} strings)...`
    );
    const translated = await translateBatch(batchObj, locale, apiKey);

    // Validate keys match
    const inputKeys = new Set(Object.keys(batchObj));
    const outputKeys = new Set(Object.keys(translated));
    const missing = [...inputKeys].filter((k) => !outputKeys.has(k));
    const extra = [...outputKeys].filter((k) => !inputKeys.has(k));
    if (missing.length > 0) {
      console.warn(
        `  Warning: missing keys in batch ${i + 1}: ${missing.join(", ")}`
      );
    }
    if (extra.length > 0) {
      console.warn(
        `  Warning: extra keys in batch ${i + 1}: ${extra.join(", ")}`
      );
    }

    Object.assign(allTranslated, translated);
  }

  const output = unflatten(allTranslated, source);

  // Count strings flagged for review
  const reviewCount = Object.values(allTranslated).filter((v) =>
    v.startsWith("[REVIEW]")
  ).length;

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(output, null, 2) + "\n", "utf-8");

  console.log(`\nDone! Written to: ${outputPath}`);
  console.log(`Total strings translated: ${Object.keys(allTranslated).length}`);
  if (reviewCount > 0) {
    console.log(
      `Strings flagged for human review ([REVIEW] prefix): ${reviewCount}`
    );
    console.log(`  Search for "[REVIEW]" in ${outputPath} to find them.`);
  }
}

main().catch((err) => {
  console.error(
    "Translation failed:",
    err instanceof Error ? err.message : err
  );
  process.exit(1);
});
