#!/usr/bin/env npx ts-node
/* eslint-disable no-console */
/**
 * Tool Generator Script
 *
 * Generates boilerplate for new tools with proper structure,
 * tests, and registration.
 *
 * Usage:
 *   pnpm generate:tool --name minify --category json
 *   pnpm generate:tool --name minify --category json --tier client --keywords "minify,compact"
 */

import * as fs from "fs";
import * as path from "path";

// Parse command line arguments
interface ToolOptions {
  name: string;
  category: string;
  tier: "client";
  keywords: string[];
  description: string;
  noOptions: boolean;
  force: boolean;
}

function parseArgs(): ToolOptions {
  const args = process.argv.slice(2);
  const options: Partial<ToolOptions> = {
    tier: "client",
    keywords: [],
    description: "",
    noOptions: false,
    force: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case "--name":
      case "-n":
        if (nextArg) options.name = nextArg;
        i++;
        break;
      case "--category":
      case "-c":
        if (nextArg) options.category = nextArg;
        i++;
        break;
      case "--tier":
      case "-t":
        options.tier = nextArg as ToolOptions["tier"];
        i++;
        break;
      case "--keywords":
      case "-k":
        options.keywords = nextArg?.split(",").map((k) => k.trim()) ?? [];
        i++;
        break;
      case "--description":
      case "-d":
        if (nextArg) options.description = nextArg;
        i++;
        break;
      case "--no-options":
        options.noOptions = true;
        break;
      case "--force":
      case "-f":
        options.force = true;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
    }
  }

  if (!options.name || !options.category) {
    console.error("Error: --name and --category are required");
    printHelp();
    process.exit(1);
  }

  return options as ToolOptions;
}

function printHelp(): void {
  console.log(`
Tool Generator - Create new tool boilerplate

Usage:
  pnpm generate:tool --name <name> --category <category> [options]

Required:
  --name, -n        Tool name in kebab-case (e.g., "minify", "to-json")
  --category, -c    Category (json, yaml, xml, csv, toml, data, text, markdown, docs, readme)

Options:
  --tier, -t        Tool tier: client (default: client)
  --keywords, -k    Comma-separated keywords for search
  --description, -d Tool description
  --no-options      Skip generating options schema
  --force, -f       Overwrite existing files
  --help, -h        Show this help message

Examples:
  pnpm generate:tool --name minify --category json
  pnpm generate:tool --name to-json --category yaml --keywords "convert,transform"
  pnpm generate:tool --name word-counter --category text --tier client --no-options
`);
}

function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_match: string, letter: string) =>
    letter.toUpperCase()
  );
}

function toTitleCase(str: string): string {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getTierEnum(_tier: string): string {
  return "ToolTier.CLIENT";
}

function generateToolFile(options: ToolOptions): string {
  const { name, category, tier, keywords, description, noOptions } = options;
  const toolName = toCamelCase(name);
  const displayName = toTitleCase(name);
  const desc = description || `${displayName} tool for ${category} operations`;
  const keywordsArray = keywords.length > 0 ? keywords : [category, name];

  const optionsSection = noOptions
    ? ""
    : `
const optionsSchema = z.object({
  // Add options here
  // example: z.string().default("value").describe("Description"),
});

type Options = z.infer<typeof optionsSchema>;
`;

  const executeParams = noOptions
    ? "input: Input"
    : "input: Input, options?: Options";
  const optionsSchemaLine = noOptions ? "" : "  optionsSchema,";

  return `import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";

const inputSchema = z.object({
  input: z.string().describe("Input to process"),
});

const outputSchema = z.object({
  output: z.string().describe("Processed output"),
});
${optionsSection}
type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * ${desc}
 */
function execute(${executeParams}): Output {
  const { input: value } = input;

  // TODO: Implement tool logic
  const result = value;

  return { output: result };
}

/**
 * ${displayName} tool.
 * ${desc}
 */
export const ${toolName} = defineTool({
  meta: {
    id: "${category}/${name}",
    name: "${displayName}",
    description: "${desc}",
    category: "${category}",
    tier: ${getTierEnum(tier)},
    keywords: ${JSON.stringify(keywordsArray)},
  },
  inputSchema,
  outputSchema,
${optionsSchemaLine}
  execute,
});
`;
}

function generateTestFile(options: ToolOptions): string {
  const { name, category, noOptions } = options;
  const toolName = toCamelCase(name);

  const optionsTest = noOptions
    ? ""
    : `
    it("should handle options", async () => {
      const result = await executeTool(
        ${toolName},
        { input: "test" },
        { /* options */ }
      );

      expect(result.success).toBe(true);
    });
`;

  return `import { describe, it, expect } from "vitest";
import { ${toolName} } from "../../../src/tools/${category}/${name}";
import { executeTool } from "../../../src/core/executor";

describe("${toolName}", () => {
  describe("execute", () => {
    it("should process valid input", async () => {
      const result = await executeTool(${toolName}, { input: "test" });

      expect(result.success).toBe(true);
      expect(result.data?.output).toBeDefined();
    });
${optionsTest}
    it("should return error for empty input", async () => {
      const result = await executeTool(${toolName}, { input: "" });

      // Adjust based on tool behavior
      expect(result.success).toBe(true);
    });
  });

  describe("metadata", () => {
    it("should have correct id", () => {
      expect(${toolName}.meta.id).toBe("${category}/${name}");
    });

    it("should have correct category", () => {
      expect(${toolName}.meta.category).toBe("${category}");
    });

    it("should be client-side by default", () => {
      expect(${toolName}.meta.tier).toBe("client");
    });
  });
});
`;
}

function getSubcategory(category: string): string | null {
  const subcategories: Record<string, string[]> = {
    text: ["transform", "analysis", "compare", "generate", "extract"],
  };
  const first = subcategories[category]?.[0];
  return first ?? null;
}

function main(): void {
  const options = parseArgs();
  const { name, category, force } = options;

  const packagesDir = path.resolve(__dirname, "..");
  const subcategory = getSubcategory(category);

  const toolDir = subcategory
    ? path.join(packagesDir, "src", "tools", category, subcategory)
    : path.join(packagesDir, "src", "tools", category);
  const testDir = subcategory
    ? path.join(packagesDir, "tests", "tools", category, subcategory)
    : path.join(packagesDir, "tests", "tools", category);

  const toolFile = path.join(toolDir, `${name}.ts`);
  const testFile = path.join(testDir, `${name}.test.ts`);

  // Check for existing files
  if (!force) {
    if (fs.existsSync(toolFile)) {
      console.error(`Error: Tool file already exists: ${toolFile}`);
      console.error("Use --force to overwrite");
      process.exit(1);
    }
    if (fs.existsSync(testFile)) {
      console.error(`Error: Test file already exists: ${testFile}`);
      console.error("Use --force to overwrite");
      process.exit(1);
    }
  }

  // Create directories
  fs.mkdirSync(toolDir, { recursive: true });
  fs.mkdirSync(testDir, { recursive: true });

  // Generate files
  const toolContent = generateToolFile(options);
  const testContent = generateTestFile(options);

  fs.writeFileSync(toolFile, toolContent);
  fs.writeFileSync(testFile, testContent);

  console.log(`✓ Created tool file: ${toolFile}`);
  console.log(`✓ Created test file: ${testFile}`);
  console.log(`
Next steps:
1. Implement the execute function in ${toolFile}
2. Update tests in ${testFile}
3. Export from src/tools/${category}/index.ts:
   export { ${toCamelCase(name)} } from "./${name}";
4. Register in src/tools/register.ts
5. Run tests: pnpm --filter @utils-live/tools test
`);
}

main();
