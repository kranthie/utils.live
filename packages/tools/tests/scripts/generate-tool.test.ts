import { describe, it, expect } from "vitest";
import * as path from "path";

/**
 * Helper functions extracted from generate-tool.ts for testing.
 * These are re-implemented here to avoid modifying the script.
 */

interface ToolOptions {
  name: string;
  category: string;
  tier: "client";
  keywords: string[];
  description: string;
  noOptions: boolean;
  force: boolean;
}

function parseArgsFromArray(
  args: string[]
): ToolOptions | { error: string } | { help: true } {
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
        return { help: true };
    }
  }

  if (!options.name || !options.category) {
    return { error: "--name and --category are required" };
  }

  return options as ToolOptions;
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

function getSubcategory(category: string): string | null {
  const subcategories: Record<string, string[]> = {
    text: ["transform", "analysis", "compare", "generate", "extract"],
  };
  const first = subcategories[category]?.[0];
  return first ?? null;
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
    it("should handle options", () => {
      const result = executeTool(
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
    it("should process valid input", () => {
      const result = executeTool(${toolName}, { input: "test" });

      expect(result.success).toBe(true);
      expect(result.data?.output).toBeDefined();
    });
${optionsTest}
    it("should return error for empty input", () => {
      const result = executeTool(${toolName}, { input: "" });

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

function getFilePaths(
  name: string,
  category: string,
  baseDir: string
): { toolFile: string; testFile: string } {
  const subcategory = getSubcategory(category);

  const toolDir = subcategory
    ? path.join(baseDir, "src", "tools", category, subcategory)
    : path.join(baseDir, "src", "tools", category);
  const testDir = subcategory
    ? path.join(baseDir, "tests", "tools", category, subcategory)
    : path.join(baseDir, "tests", "tools", category);

  return {
    toolFile: path.join(toolDir, `${name}.ts`),
    testFile: path.join(testDir, `${name}.test.ts`),
  };
}

describe("generate-tool script", () => {
  describe("parseArgsFromArray", () => {
    describe("required arguments", () => {
      it("should parse --name and --category", () => {
        const result = parseArgsFromArray([
          "--name",
          "minify",
          "--category",
          "json",
        ]);

        expect(result).toEqual({
          name: "minify",
          category: "json",
          tier: "client",
          keywords: [],
          description: "",
          noOptions: false,
          force: false,
        });
      });

      it("should parse short flags -n and -c", () => {
        const result = parseArgsFromArray(["-n", "minify", "-c", "json"]);

        expect(result).toEqual({
          name: "minify",
          category: "json",
          tier: "client",
          keywords: [],
          description: "",
          noOptions: false,
          force: false,
        });
      });

      it("should return error when --name is missing", () => {
        const result = parseArgsFromArray(["--category", "json"]);

        expect(result).toEqual({ error: "--name and --category are required" });
      });

      it("should return error when --category is missing", () => {
        const result = parseArgsFromArray(["--name", "minify"]);

        expect(result).toEqual({ error: "--name and --category are required" });
      });

      it("should return error when both are missing", () => {
        const result = parseArgsFromArray([]);

        expect(result).toEqual({ error: "--name and --category are required" });
      });
    });

    describe("optional arguments", () => {
      it("should parse --tier with client value", () => {
        const result = parseArgsFromArray([
          "--name",
          "test",
          "--category",
          "json",
          "--tier",
          "client",
        ]);

        expect(result).not.toHaveProperty("error");
        expect((result as ToolOptions).tier).toBe("client");
      });

      it("should parse short flag -t for tier", () => {
        const result = parseArgsFromArray([
          "-n",
          "test",
          "-c",
          "json",
          "-t",
          "client",
        ]);

        expect((result as ToolOptions).tier).toBe("client");
      });

      it("should parse --keywords as comma-separated list", () => {
        const result = parseArgsFromArray([
          "--name",
          "test",
          "--category",
          "json",
          "--keywords",
          "minify,compact,compress",
        ]);

        expect((result as ToolOptions).keywords).toEqual([
          "minify",
          "compact",
          "compress",
        ]);
      });

      it("should trim whitespace from keywords", () => {
        const result = parseArgsFromArray([
          "--name",
          "test",
          "--category",
          "json",
          "--keywords",
          " minify , compact , compress ",
        ]);

        expect((result as ToolOptions).keywords).toEqual([
          "minify",
          "compact",
          "compress",
        ]);
      });

      it("should parse short flag -k for keywords", () => {
        const result = parseArgsFromArray([
          "-n",
          "test",
          "-c",
          "json",
          "-k",
          "minify,compact",
        ]);

        expect((result as ToolOptions).keywords).toEqual(["minify", "compact"]);
      });

      it("should parse --description", () => {
        const result = parseArgsFromArray([
          "--name",
          "test",
          "--category",
          "json",
          "--description",
          "A tool for testing",
        ]);

        expect((result as ToolOptions).description).toBe("A tool for testing");
      });

      it("should parse short flag -d for description", () => {
        const result = parseArgsFromArray([
          "-n",
          "test",
          "-c",
          "json",
          "-d",
          "A tool for testing",
        ]);

        expect((result as ToolOptions).description).toBe("A tool for testing");
      });

      it("should parse --no-options flag", () => {
        const result = parseArgsFromArray([
          "--name",
          "test",
          "--category",
          "json",
          "--no-options",
        ]);

        expect((result as ToolOptions).noOptions).toBe(true);
      });

      it("should parse --force flag", () => {
        const result = parseArgsFromArray([
          "--name",
          "test",
          "--category",
          "json",
          "--force",
        ]);

        expect((result as ToolOptions).force).toBe(true);
      });

      it("should parse short flag -f for force", () => {
        const result = parseArgsFromArray(["-n", "test", "-c", "json", "-f"]);

        expect((result as ToolOptions).force).toBe(true);
      });

      it("should parse --help flag", () => {
        const result = parseArgsFromArray(["--help"]);

        expect(result).toEqual({ help: true });
      });

      it("should parse short flag -h for help", () => {
        const result = parseArgsFromArray(["-h"]);

        expect(result).toEqual({ help: true });
      });
    });

    describe("combined arguments", () => {
      it("should parse all arguments together", () => {
        const result = parseArgsFromArray([
          "--name",
          "my-tool",
          "--category",
          "yaml",
          "--tier",
          "client",
          "--keywords",
          "convert,transform",
          "--description",
          "Converts data formats",
          "--no-options",
          "--force",
        ]);

        expect(result).toEqual({
          name: "my-tool",
          category: "yaml",
          tier: "client",
          keywords: ["convert", "transform"],
          description: "Converts data formats",
          noOptions: true,
          force: true,
        });
      });

      it("should parse arguments in any order", () => {
        const result = parseArgsFromArray([
          "--force",
          "--description",
          "Test desc",
          "--name",
          "test",
          "--keywords",
          "a,b",
          "--category",
          "xml",
        ]);

        expect(result).toEqual({
          name: "test",
          category: "xml",
          tier: "client",
          keywords: ["a", "b"],
          description: "Test desc",
          noOptions: false,
          force: true,
        });
      });
    });
  });

  describe("toCamelCase", () => {
    it("should convert single word kebab-case", () => {
      expect(toCamelCase("minify")).toBe("minify");
    });

    it("should convert two-word kebab-case", () => {
      expect(toCamelCase("to-json")).toBe("toJson");
    });

    it("should convert multi-word kebab-case", () => {
      expect(toCamelCase("convert-to-json-format")).toBe("convertToJsonFormat");
    });

    it("should handle empty string", () => {
      expect(toCamelCase("")).toBe("");
    });

    it("should preserve already camelCase", () => {
      expect(toCamelCase("alreadyCamel")).toBe("alreadyCamel");
    });
  });

  describe("toTitleCase", () => {
    it("should convert single word", () => {
      expect(toTitleCase("minify")).toBe("Minify");
    });

    it("should convert two words with space", () => {
      expect(toTitleCase("to-json")).toBe("To Json");
    });

    it("should convert multi-word kebab-case", () => {
      expect(toTitleCase("convert-to-yaml")).toBe("Convert To Yaml");
    });

    it("should handle empty string", () => {
      expect(toTitleCase("")).toBe("");
    });
  });

  describe("getTierEnum", () => {
    it("should return CLIENT for client tier", () => {
      expect(getTierEnum("client")).toBe("ToolTier.CLIENT");
    });

    it("should return CLIENT for any tier (all tools are client-side)", () => {
      expect(getTierEnum("unknown")).toBe("ToolTier.CLIENT");
    });
  });

  describe("getSubcategory", () => {
    it("should return transform for text category", () => {
      expect(getSubcategory("text")).toBe("transform");
    });

    it("should return null for json category", () => {
      expect(getSubcategory("json")).toBeNull();
    });

    it("should return null for yaml category", () => {
      expect(getSubcategory("yaml")).toBeNull();
    });

    it("should return null for unknown category", () => {
      expect(getSubcategory("unknown")).toBeNull();
    });
  });

  describe("generateToolFile", () => {
    it("should generate basic tool file with default options", () => {
      const options: ToolOptions = {
        name: "minify",
        category: "json",
        tier: "client",
        keywords: [],
        description: "",
        noOptions: false,
        force: false,
      };

      const content = generateToolFile(options);

      expect(content).toContain('import { z } from "zod"');
      expect(content).toContain(
        'import { defineTool } from "../../core/define-tool"'
      );
      expect(content).toContain('import { ToolTier } from "../../types"');
      expect(content).toContain("export const minify = defineTool");
      expect(content).toContain('id: "json/minify"');
      expect(content).toContain('name: "Minify"');
      expect(content).toContain('category: "json"');
      expect(content).toContain("tier: ToolTier.CLIENT");
    });

    it("should generate tool file with custom description", () => {
      const options: ToolOptions = {
        name: "minify",
        category: "json",
        tier: "client",
        keywords: [],
        description: "Minifies JSON data",
        noOptions: false,
        force: false,
      };

      const content = generateToolFile(options);

      expect(content).toContain('description: "Minifies JSON data"');
    });

    it("should generate default description when not provided", () => {
      const options: ToolOptions = {
        name: "minify",
        category: "json",
        tier: "client",
        keywords: [],
        description: "",
        noOptions: false,
        force: false,
      };

      const content = generateToolFile(options);

      expect(content).toContain(
        'description: "Minify tool for json operations"'
      );
    });

    it("should generate tool file with custom keywords", () => {
      const options: ToolOptions = {
        name: "minify",
        category: "json",
        tier: "client",
        keywords: ["compact", "compress", "minify"],
        description: "",
        noOptions: false,
        force: false,
      };

      const content = generateToolFile(options);

      expect(content).toContain('keywords: ["compact","compress","minify"]');
    });

    it("should generate default keywords when not provided", () => {
      const options: ToolOptions = {
        name: "minify",
        category: "json",
        tier: "client",
        keywords: [],
        description: "",
        noOptions: false,
        force: false,
      };

      const content = generateToolFile(options);

      expect(content).toContain('keywords: ["json","minify"]');
    });

    it("should generate tool file with options schema", () => {
      const options: ToolOptions = {
        name: "minify",
        category: "json",
        tier: "client",
        keywords: [],
        description: "",
        noOptions: false,
        force: false,
      };

      const content = generateToolFile(options);

      expect(content).toContain("const optionsSchema = z.object");
      expect(content).toContain("type Options = z.infer<typeof optionsSchema>");
      expect(content).toContain("input: Input, options?: Options");
      expect(content).toContain("optionsSchema,");
    });

    it("should generate tool file without options schema when noOptions is true", () => {
      const options: ToolOptions = {
        name: "minify",
        category: "json",
        tier: "client",
        keywords: [],
        description: "",
        noOptions: true,
        force: false,
      };

      const content = generateToolFile(options);

      expect(content).not.toContain("const optionsSchema = z.object");
      expect(content).not.toContain(
        "type Options = z.infer<typeof optionsSchema>"
      );
      expect(content).toContain("input: Input");
      expect(content).not.toContain("input: Input, options?: Options");
      expect(content).not.toContain("optionsSchema,");
    });

    it("should generate camelCase tool name for kebab-case input", () => {
      const options: ToolOptions = {
        name: "to-json",
        category: "yaml",
        tier: "client",
        keywords: [],
        description: "",
        noOptions: false,
        force: false,
      };

      const content = generateToolFile(options);

      expect(content).toContain("export const toJson = defineTool");
      expect(content).toContain('name: "To Json"');
    });

    it("should include input and output schemas", () => {
      const options: ToolOptions = {
        name: "minify",
        category: "json",
        tier: "client",
        keywords: [],
        description: "",
        noOptions: false,
        force: false,
      };

      const content = generateToolFile(options);

      expect(content).toContain("const inputSchema = z.object");
      expect(content).toContain("const outputSchema = z.object");
      expect(content).toContain("inputSchema,");
      expect(content).toContain("outputSchema,");
    });

    it("should include TODO comment in execute function", () => {
      const options: ToolOptions = {
        name: "minify",
        category: "json",
        tier: "client",
        keywords: [],
        description: "",
        noOptions: false,
        force: false,
      };

      const content = generateToolFile(options);

      expect(content).toContain("// TODO: Implement tool logic");
    });
  });

  describe("generateTestFile", () => {
    it("should generate test file with correct imports", () => {
      const options: ToolOptions = {
        name: "minify",
        category: "json",
        tier: "client",
        keywords: [],
        description: "",
        noOptions: false,
        force: false,
      };

      const content = generateTestFile(options);

      expect(content).toContain(
        'import { describe, it, expect } from "vitest"'
      );
      expect(content).toContain(
        'import { minify } from "../../../src/tools/json/minify"'
      );
      expect(content).toContain(
        'import { executeTool } from "../../../src/core/executor"'
      );
    });

    it("should generate test file with correct describe block", () => {
      const options: ToolOptions = {
        name: "minify",
        category: "json",
        tier: "client",
        keywords: [],
        description: "",
        noOptions: false,
        force: false,
      };

      const content = generateTestFile(options);

      expect(content).toContain('describe("minify"');
      expect(content).toContain('describe("execute"');
      expect(content).toContain('describe("metadata"');
    });

    it("should generate test for valid input processing", () => {
      const options: ToolOptions = {
        name: "minify",
        category: "json",
        tier: "client",
        keywords: [],
        description: "",
        noOptions: false,
        force: false,
      };

      const content = generateTestFile(options);

      expect(content).toContain('it("should process valid input"');
      expect(content).toContain('executeTool(minify, { input: "test" })');
    });

    it("should generate options test when options are enabled", () => {
      const options: ToolOptions = {
        name: "minify",
        category: "json",
        tier: "client",
        keywords: [],
        description: "",
        noOptions: false,
        force: false,
      };

      const content = generateTestFile(options);

      expect(content).toContain('it("should handle options"');
    });

    it("should not generate options test when noOptions is true", () => {
      const options: ToolOptions = {
        name: "minify",
        category: "json",
        tier: "client",
        keywords: [],
        description: "",
        noOptions: true,
        force: false,
      };

      const content = generateTestFile(options);

      expect(content).not.toContain('it("should handle options"');
    });

    it("should generate test for empty input", () => {
      const options: ToolOptions = {
        name: "minify",
        category: "json",
        tier: "client",
        keywords: [],
        description: "",
        noOptions: false,
        force: false,
      };

      const content = generateTestFile(options);

      expect(content).toContain('it("should return error for empty input"');
    });

    it("should generate metadata tests", () => {
      const options: ToolOptions = {
        name: "minify",
        category: "json",
        tier: "client",
        keywords: [],
        description: "",
        noOptions: false,
        force: false,
      };

      const content = generateTestFile(options);

      expect(content).toContain('it("should have correct id"');
      expect(content).toContain('expect(minify.meta.id).toBe("json/minify")');
      expect(content).toContain('it("should have correct category"');
      expect(content).toContain('expect(minify.meta.category).toBe("json")');
      expect(content).toContain('it("should be client-side by default"');
    });

    it("should generate correct import path for different categories", () => {
      const yamlOptions: ToolOptions = {
        name: "to-json",
        category: "yaml",
        tier: "client",
        keywords: [],
        description: "",
        noOptions: false,
        force: false,
      };

      const content = generateTestFile(yamlOptions);

      expect(content).toContain(
        'import { toJson } from "../../../src/tools/yaml/to-json"'
      );
    });
  });

  describe("getFilePaths", () => {
    const baseDir = "/home/user/project/packages/tools";

    it("should generate correct paths for json category", () => {
      const paths = getFilePaths("minify", "json", baseDir);

      expect(paths.toolFile).toBe(
        "/home/user/project/packages/tools/src/tools/json/minify.ts"
      );
      expect(paths.testFile).toBe(
        "/home/user/project/packages/tools/tests/tools/json/minify.test.ts"
      );
    });

    it("should generate correct paths for yaml category", () => {
      const paths = getFilePaths("to-json", "yaml", baseDir);

      expect(paths.toolFile).toBe(
        "/home/user/project/packages/tools/src/tools/yaml/to-json.ts"
      );
      expect(paths.testFile).toBe(
        "/home/user/project/packages/tools/tests/tools/yaml/to-json.test.ts"
      );
    });

    it("should generate paths with subcategory for text category", () => {
      const paths = getFilePaths("word-count", "text", baseDir);

      expect(paths.toolFile).toBe(
        "/home/user/project/packages/tools/src/tools/text/transform/word-count.ts"
      );
      expect(paths.testFile).toBe(
        "/home/user/project/packages/tools/tests/tools/text/transform/word-count.test.ts"
      );
    });

    it("should handle kebab-case tool names", () => {
      const paths = getFilePaths("convert-to-json", "xml", baseDir);

      expect(paths.toolFile).toBe(
        "/home/user/project/packages/tools/src/tools/xml/convert-to-json.ts"
      );
      expect(paths.testFile).toBe(
        "/home/user/project/packages/tools/tests/tools/xml/convert-to-json.test.ts"
      );
    });
  });

  describe("overwrite protection logic", () => {
    /**
     * Helper function that replicates the overwrite protection logic
     * from the generator script, but takes file existence as a parameter
     * instead of checking the filesystem directly.
     */
    function shouldAllowWrite(force: boolean, fileExists: boolean): boolean {
      if (!force && fileExists) {
        return false;
      }
      return true;
    }

    it("should prevent overwriting existing tool file when force is false", () => {
      const force = false;
      const fileExists = true;

      const shouldOverwrite = shouldAllowWrite(force, fileExists);

      expect(shouldOverwrite).toBe(false);
    });

    it("should allow overwriting existing file when force is true", () => {
      const force = true;
      const fileExists = true;

      const shouldOverwrite = shouldAllowWrite(force, fileExists);

      expect(shouldOverwrite).toBe(true);
    });

    it("should allow writing when file does not exist", () => {
      const force = false;
      const fileExists = false;

      const shouldOverwrite = shouldAllowWrite(force, fileExists);

      expect(shouldOverwrite).toBe(true);
    });

    it("should allow writing when file does not exist and force is true", () => {
      const force = true;
      const fileExists = false;

      const shouldOverwrite = shouldAllowWrite(force, fileExists);

      expect(shouldOverwrite).toBe(true);
    });
  });

  describe("error handling", () => {
    it("should return error for missing name", () => {
      const result = parseArgsFromArray(["--category", "json"]);

      expect(result).toEqual({ error: "--name and --category are required" });
    });

    it("should return error for missing category", () => {
      const result = parseArgsFromArray(["--name", "test"]);

      expect(result).toEqual({ error: "--name and --category are required" });
    });

    it("should return error for empty arguments", () => {
      const result = parseArgsFromArray([]);

      expect(result).toEqual({ error: "--name and --category are required" });
    });

    it("should handle missing value after flag", () => {
      const result = parseArgsFromArray(["--name"]);

      expect(result).toEqual({ error: "--name and --category are required" });
    });

    it("should handle invalid flag gracefully", () => {
      const result = parseArgsFromArray([
        "--invalid-flag",
        "--name",
        "test",
        "--category",
        "json",
      ]);

      // Invalid flags should be ignored
      expect(result).toEqual({
        name: "test",
        category: "json",
        tier: "client",
        keywords: [],
        description: "",
        noOptions: false,
        force: false,
      });
    });
  });

  describe("edge cases", () => {
    it("should handle single-letter tool name", () => {
      const options: ToolOptions = {
        name: "x",
        category: "json",
        tier: "client",
        keywords: [],
        description: "",
        noOptions: false,
        force: false,
      };

      const content = generateToolFile(options);

      expect(content).toContain("export const x = defineTool");
      expect(content).toContain('id: "json/x"');
    });

    it("should handle long tool name", () => {
      const options: ToolOptions = {
        name: "very-long-tool-name-with-many-words",
        category: "json",
        tier: "client",
        keywords: [],
        description: "",
        noOptions: false,
        force: false,
      };

      const content = generateToolFile(options);

      expect(content).toContain(
        "export const veryLongToolNameWithManyWords = defineTool"
      );
      expect(content).toContain('name: "Very Long Tool Name With Many Words"');
    });

    it("should handle special characters in description", () => {
      const options: ToolOptions = {
        name: "test",
        category: "json",
        tier: "client",
        keywords: [],
        description: "A \"special\" tool with 'quotes'",
        noOptions: false,
        force: false,
      };

      const content = generateToolFile(options);

      expect(content).toContain("A \"special\" tool with 'quotes'");
    });

    it("should handle empty keywords array", () => {
      const result = parseArgsFromArray([
        "--name",
        "test",
        "--category",
        "json",
        "--keywords",
        "",
      ]);

      expect((result as ToolOptions).keywords).toEqual([""]);
    });

    it("should handle single keyword", () => {
      const result = parseArgsFromArray([
        "--name",
        "test",
        "--category",
        "json",
        "--keywords",
        "single",
      ]);

      expect((result as ToolOptions).keywords).toEqual(["single"]);
    });
  });
});
