#!/usr/bin/env tsx
/**
 * Delta Translation Pipeline for utils.live
 *
 * Translates only new keys and [REVIEW]-flagged texts from delta files,
 * then merges the results back into the locale message files.
 *
 * Delta files live at: apps/web/tmp/i18n-delta/{locale}-new-keys.json
 *                      apps/web/tmp/i18n-delta/{locale}-review-texts.json
 *
 * Usage:
 *   pnpm translate-delta --locale es   # Translate delta for Spanish
 *   pnpm translate-delta --all         # Translate deltas for all locales
 *
 * Requirements:
 *   ANTHROPIC_API_KEY environment variable must be set (loaded from .env).
 */

import dotenv from "dotenv";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------

const TARGET_LOCALES = [
  "ja",
  "pt-BR",
  "ko",
  "zh-CN",
  "de",
  "fr",
  "es",
  "ru",
  "zh-TW",
  "tr",
];

function parseArgs(): { locales: string[] } {
  const args = process.argv.slice(2);

  if (args.includes("--all")) {
    return { locales: TARGET_LOCALES };
  }

  const localeIndex = args.indexOf("--locale");
  if (localeIndex === -1 || !args[localeIndex + 1]) {
    console.error("Usage: pnpm translate-delta --locale <locale-code>");
    console.error("       pnpm translate-delta --all");
    console.error("Example: pnpm translate-delta --locale es");
    console.error(`Supported locales: ${TARGET_LOCALES.join(", ")}`);
    process.exit(1);
  }
  const locale = args[localeIndex + 1].trim();
  if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(locale)) {
    console.error(
      `Invalid locale format: "${locale}". Expected e.g. "es", "fr", "de", "pt-BR"`
    );
    process.exit(1);
  }
  return { locales: [locale] };
}

// ---------------------------------------------------------------------------
// Nested JSON helpers
// ---------------------------------------------------------------------------

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

/**
 * Flatten a nested JSON object into dot-notation key -> value pairs.
 * Only leaf string values are included.
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
 * Set a value at a dot-notation path in a nested object, creating
 * intermediate objects as needed.
 */
function setNestedValue(obj: JsonObject, dotPath: string, value: string): void {
  const parts = dotPath.split(".");
  let node: JsonObject = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (
      node[parts[i]] === undefined ||
      node[parts[i]] === null ||
      typeof node[parts[i]] !== "object" ||
      Array.isArray(node[parts[i]])
    ) {
      node[parts[i]] = {};
    }
    node = node[parts[i]] as JsonObject;
  }
  node[parts[parts.length - 1]] = value;
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
  "zh-CN": "Simplified Chinese",
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
  nb: "Norwegian Bokmal",
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
7. Do NOT prepend "[REVIEW]" to any translations. Translate naturally without any review markers.
8. Match the tone: concise, technical, professional. Avoid overly formal language.`;

  const userPrompt = `Translate all values in this JSON from English to ${localeName}.
Remember: same keys, translated values only, preserve ICU patterns exactly. Do NOT add any [REVIEW] prefix.

${inputJson}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 16384,
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
// Chunking
// ---------------------------------------------------------------------------

const CHUNK_SIZE = 25;

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ---------------------------------------------------------------------------
// Delta file reading
// ---------------------------------------------------------------------------

function readJsonFile(path: string): JsonObject {
  if (!existsSync(path)) {
    return {};
  }
  const content = readFileSync(path, "utf-8").trim();
  if (!content || content === "{}") {
    return {};
  }
  return JSON.parse(content) as JsonObject;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function translateDeltaForLocale(
  locale: string,
  enFlat: Record<string, string>,
  enSource: JsonObject,
  apiKey: string
): Promise<void> {
  const deltaDir = resolve(ROOT, "apps/web/tmp/i18n-delta");
  const messagesPath = resolve(ROOT, `apps/web/messages/${locale}.json`);

  // 1. Read delta files
  const newKeysPath = resolve(deltaDir, `${locale}-new-keys.json`);
  const reviewTextsPath = resolve(deltaDir, `${locale}-review-texts.json`);

  const newKeysRaw = readJsonFile(newKeysPath);
  const reviewTextsRaw = readJsonFile(reviewTextsPath);

  // Flatten new keys (they are nested JSON with English values)
  const newKeysFlat = flattenStrings(newKeysRaw);

  // Review texts are already flat dot-notation keys with [REVIEW] prefixed translations
  // We need the ENGLISH source text for these keys, not the bad translations
  const reviewKeysEnglish: Record<string, string> = {};
  for (const key of Object.keys(reviewTextsRaw)) {
    const englishValue = enFlat[key];
    if (englishValue !== undefined) {
      reviewKeysEnglish[key] = englishValue;
    } else {
      console.warn(
        `  Warning: review key "${key}" not found in en.json, skipping`
      );
    }
  }

  const totalNewKeys = Object.keys(newKeysFlat).length;
  const totalReviewKeys = Object.keys(reviewKeysEnglish).length;
  const totalKeys = totalNewKeys + totalReviewKeys;

  if (totalKeys === 0) {
    console.log(`  No delta strings for ${locale}, skipping.`);
    return;
  }

  console.log(
    `\nTranslating delta for ${getLocaleName(locale)} (${locale}): ` +
      `${totalNewKeys} new keys + ${totalReviewKeys} review keys = ${totalKeys} total`
  );

  // 2. Combine all strings to translate (all are English source text)
  const allToTranslate: Record<string, string> = {
    ...newKeysFlat,
    ...reviewKeysEnglish,
  };

  // 3. Translate in batches
  const entries = Object.entries(allToTranslate);
  const chunks_ = chunk(entries, CHUNK_SIZE);

  const allTranslated: Record<string, string> = {};

  for (let i = 0; i < chunks_.length; i++) {
    const batchObj = Object.fromEntries(chunks_[i]);
    console.log(
      `  Batch ${i + 1}/${chunks_.length} (${chunks_[i].length} strings)...`
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

  // 4. Strip any [REVIEW] prefix the model may have added
  for (const [key, value] of Object.entries(allTranslated)) {
    if (typeof value === "string" && value.startsWith("[REVIEW] ")) {
      allTranslated[key] = value.slice("[REVIEW] ".length);
    } else if (typeof value === "string" && value.startsWith("[REVIEW]")) {
      allTranslated[key] = value.slice("[REVIEW]".length).trimStart();
    }
  }

  // 5. Read existing locale messages file and merge translations
  const existingMessages = readJsonFile(messagesPath);

  for (const [dotPath, translatedValue] of Object.entries(allTranslated)) {
    setNestedValue(existingMessages, dotPath, translatedValue);
  }

  // 6. Write back
  writeFileSync(
    messagesPath,
    JSON.stringify(existingMessages, null, 2) + "\n",
    "utf-8"
  );

  console.log(`  Written to: ${messagesPath}`);
  console.log(`  Total strings merged: ${Object.keys(allTranslated).length}`);
}

async function main(): Promise<void> {
  const { locales } = parseArgs();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is not set.");
    console.error(
      "Set it in .env file or with: export ANTHROPIC_API_KEY=sk-ant-..."
    );
    process.exit(1);
  }

  // Load English source for review text lookups
  const enPath = resolve(ROOT, "apps/web/messages/en.json");
  console.log(`Reading English source: ${enPath}`);
  const enSource = JSON.parse(
    readFileSync(enPath, "utf-8")
  ) as unknown as JsonObject;
  const enFlat = flattenStrings(enSource);
  console.log(`English source has ${Object.keys(enFlat).length} strings`);
  console.log(`Target locales: ${locales.join(", ")}`);

  for (const locale of locales) {
    await translateDeltaForLocale(locale, enFlat, enSource, apiKey);
  }

  console.log(
    `\nAll done! Processed delta translations for ${locales.length} locale(s).`
  );
}

main().catch((err) => {
  console.error(
    "Delta translation failed:",
    err instanceof Error ? err.message : err
  );
  process.exit(1);
});
