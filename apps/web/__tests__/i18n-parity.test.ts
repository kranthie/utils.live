import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const MESSAGES_DIR = join(__dirname, "..", "messages");

function collectKeys(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object") return [];
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      keys.push(...collectKeys(v, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

describe("i18n messages parity", () => {
  const enPath = join(MESSAGES_DIR, "en.json");
  const en = JSON.parse(readFileSync(enPath, "utf-8")) as unknown;
  const enKeys = new Set(collectKeys(en));

  const localeFiles = readdirSync(MESSAGES_DIR).filter(
    (f) => f.endsWith(".json") && f !== "en.json"
  );

  for (const file of localeFiles) {
    it(`${file} has the same key set as en.json`, () => {
      const data = JSON.parse(
        readFileSync(join(MESSAGES_DIR, file), "utf-8")
      ) as unknown;
      const keys = new Set(collectKeys(data));

      const missing = [...enKeys].filter((k) => !keys.has(k));
      const extra = [...keys].filter((k) => !enKeys.has(k));

      expect({ file, missing, extra }).toEqual({
        file,
        missing: [],
        extra: [],
      });
    });
  }
});
