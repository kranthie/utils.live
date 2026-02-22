import { z } from "zod";
import ini from "ini";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("INI string to validate"),
});

const outputSchema = z.object({
  valid: z.boolean().describe("Whether the INI is valid"),
  error: z.string().optional().describe("Error message if invalid"),
  sectionCount: z.number().describe("Number of sections"),
  keyCount: z.number().describe("Total number of keys"),
  warnings: z.array(z.string()).optional().describe("Validation warnings"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Performs stricter INI validation beyond what the `ini` package checks.
 * The `ini` package is very lenient and will parse almost anything.
 * This adds checks for common INI syntax issues.
 */
function strictValidate(input: string): string[] {
  const warnings: string[] = [];
  const lines = input.split("\n");
  let currentSection: string | null = null;
  const seenSections = new Set<string>();
  const seenKeys = new Map<string, Set<string>>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    const lineNum = i + 1;

    // Skip empty lines and comments
    if (line === "" || line.startsWith(";") || line.startsWith("#")) {
      continue;
    }

    // Check for section headers
    if (line.startsWith("[")) {
      if (!line.endsWith("]")) {
        warnings.push(`Line ${lineNum}: Unclosed section header: ${line}`);
        continue;
      }
      const sectionName = line.slice(1, -1).trim();
      if (sectionName === "") {
        warnings.push(`Line ${lineNum}: Empty section name`);
        continue;
      }
      if (seenSections.has(sectionName)) {
        warnings.push(`Line ${lineNum}: Duplicate section [${sectionName}]`);
      }
      seenSections.add(sectionName);
      currentSection = sectionName;
      if (!seenKeys.has(currentSection)) {
        seenKeys.set(currentSection, new Set());
      }
      continue;
    }

    // Check for key=value pairs
    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) {
      // Not a comment, not a section, not a key=value. This is suspicious.
      warnings.push(
        `Line ${lineNum}: Line is not a valid section, key=value pair, or comment: ${line}`
      );
      continue;
    }

    const key = line.slice(0, eqIndex).trim();
    if (key === "") {
      warnings.push(`Line ${lineNum}: Empty key name`);
      continue;
    }

    // Check for duplicate keys within same section
    const sectionKey = currentSection ?? "__global__";
    if (!seenKeys.has(sectionKey)) {
      seenKeys.set(sectionKey, new Set());
    }
    const sectionKeySet = seenKeys.get(sectionKey)!;
    if (sectionKeySet.has(key)) {
      const sectionLabel = currentSection
        ? `[${currentSection}]`
        : "global scope";
      warnings.push(
        `Line ${lineNum}: Duplicate key "${key}" in ${sectionLabel}`
      );
    }
    sectionKeySet.add(key);
  }

  return warnings;
}

/**
 * Validates an INI string.
 */
function execute(input: Input): Output {
  try {
    const parsed = ini.parse(input.input);

    let sectionCount = 0;
    let keyCount = 0;

    for (const value of Object.values(parsed)) {
      if (typeof value === "object" && value !== null) {
        sectionCount++;
        keyCount += Object.keys(value as object).length;
      } else {
        keyCount++;
      }
    }

    // Run stricter validation on top of ini.parse
    const warnings = strictValidate(input.input);

    return {
      valid: true,
      sectionCount,
      keyCount,
      ...(warnings.length > 0 ? { warnings } : {}),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid INI";
    return {
      valid: false,
      error: message,
      sectionCount: 0,
      keyCount: 0,
    };
  }
}

/**
 * INI Validator tool.
 * Validates INI configuration syntax with stricter checks than basic parsing.
 */
export const iniValidator = defineTool({
  meta: {
    id: "data/ini-validator",
    name: "INI Validator",
    description:
      "Free online INI validator — validate INI configuration syntax instantly in your browser. No data is stored. Checks for duplicate sections, duplicate keys, unclosed headers, and empty key names with detailed warnings.",
    category: "data",
    tier: ToolTier.CLIENT,
    keywords: [
      "ini",
      "validate",
      "config",
      "configuration",
      "check",
      "syntax",
      "lint",
      "duplicate",
    ],
    examples: [
      {
        title: "Valid database config section",
        description: "Validate a well-formed INI configuration file",
        input: "[database]\nhost=localhost\nport=5432",
        output: '{\n  "valid": true,\n  "sectionCount": 1,\n  "keyCount": 2\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
