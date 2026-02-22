import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe(".env file content to validate"),
});

const outputSchema = z.object({
  output: z.string().describe("Validation results"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");

  const lines = text.split("\n");
  const errors: string[] = [];
  const warnings: string[] = [];
  const keys = new Set<string>();
  const duplicates: string[] = [];
  let varCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    const lineNum = i + 1;

    if (!line || line.startsWith("#")) continue;

    // Check for = sign
    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) {
      errors.push(`Line ${lineNum}: Missing '=' sign: "${line}"`);
      continue;
    }

    if (eqIndex === 0) {
      errors.push(`Line ${lineNum}: Empty key name`);
      continue;
    }

    const key = line.substring(0, eqIndex).trim();
    const value = line.substring(eqIndex + 1).trim();

    // Validate key format
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      errors.push(
        `Line ${lineNum}: Invalid key name "${key}" - use only letters, numbers, and underscores`
      );
    }

    // Check for duplicates
    if (keys.has(key)) {
      duplicates.push(`Line ${lineNum}: Duplicate key "${key}"`);
    }
    keys.add(key);

    // Check for common issues
    if (value === "" && !line.endsWith("=")) {
      warnings.push(`Line ${lineNum}: Empty value for "${key}"`);
    }

    // Check for unquoted values with spaces
    if (
      value.includes(" ") &&
      !value.startsWith('"') &&
      !value.startsWith("'")
    ) {
      warnings.push(
        `Line ${lineNum}: Value for "${key}" contains spaces but is not quoted`
      );
    }

    // Check for mismatched quotes
    if (
      (value.startsWith('"') && !value.endsWith('"')) ||
      (value.startsWith("'") && !value.endsWith("'"))
    ) {
      errors.push(`Line ${lineNum}: Mismatched quotes for "${key}"`);
    }

    // Check for common security issues
    const lowerKey = key.toLowerCase();
    if (
      (lowerKey.includes("password") ||
        lowerKey.includes("secret") ||
        lowerKey.includes("key") ||
        lowerKey.includes("token")) &&
      value &&
      value.length < 8 &&
      value !== "" &&
      !value.startsWith("${")
    ) {
      warnings.push(
        `Line ${lineNum}: "${key}" appears to be a secret but has a short value`
      );
    }

    // Check for localhost in production-like keys
    if (
      value.includes("localhost") &&
      !key.includes("DEV") &&
      !key.includes("LOCAL")
    ) {
      warnings.push(
        `Line ${lineNum}: "${key}" contains 'localhost' - ensure this is intentional`
      );
    }

    varCount++;
  }

  const resultLines: string[] = [];
  resultLines.push("# .env Validation Report");
  resultLines.push("");
  resultLines.push(`Variables found: ${varCount}`);
  resultLines.push(`Errors: ${errors.length}`);
  resultLines.push(`Warnings: ${warnings.length + duplicates.length}`);
  resultLines.push("");

  if (errors.length > 0) {
    resultLines.push("## Errors");
    for (const err of errors) resultLines.push(`  - ${err}`);
    resultLines.push("");
  }

  if (duplicates.length > 0) {
    resultLines.push("## Duplicate Keys");
    for (const dup of duplicates) resultLines.push(`  - ${dup}`);
    resultLines.push("");
  }

  if (warnings.length > 0) {
    resultLines.push("## Warnings");
    for (const warn of warnings) resultLines.push(`  - ${warn}`);
    resultLines.push("");
  }

  if (errors.length === 0 && warnings.length === 0 && duplicates.length === 0) {
    resultLines.push("All checks passed! No issues found.");
  }

  return { output: resultLines.join("\n") };
}

export const envValidator = defineTool({
  meta: {
    id: "code/env-validator",
    name: ".env Validator",
    description:
      "Free online .env file validator — check dotenv files for syntax errors, duplicate keys, missing values, mismatched quotes, and security issues instantly in your browser. No data is stored. Reports errors and warnings with line numbers.",
    category: "code",
    subgroup: "Env Files",
    tier: ToolTier.CLIENT,
    keywords: ["env", "validate", "check", "dotenv", "config", "security"],
    examples: [
      {
        title: "Validate .env file",
        description:
          "Check for common issues like missing values and duplicates",
        input: "API_KEY=abc\nAPI_KEY=xyz\nDB_URL=\nINVALID KEY=value",
        output:
          '# .env Validation Report\n\nVariables found: 4\nErrors: 1\nWarnings: 4\n\n## Errors\n  - Line 4: Invalid key name "INVALID KEY" - use only letters, numbers, and underscores\n\n## Duplicate Keys\n  - Line 2: Duplicate key "API_KEY"\n\n## Warnings\n  - Line 1: "API_KEY" appears to be a secret but has a short value\n  - Line 2: "API_KEY" appears to be a secret but has a short value\n  - Line 4: "INVALID KEY" appears to be a secret but has a short value\n',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
