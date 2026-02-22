import { z } from "zod";
import yaml from "js-yaml";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { MARKDOWN_INVALID_FRONTMATTER } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("Markdown string with optional YAML frontmatter"),
});

const optionsSchema = z.object({
  updates: z
    .record(z.string(), z.unknown())
    .optional()
    .describe("Object of fields to add/update in frontmatter"),
  remove: z
    .array(z.string())
    .optional()
    .describe("Array of field names to remove from frontmatter"),
});

const outputSchema = z.object({
  output: z.string().describe("Modified markdown with updated frontmatter"),
  frontmatter: z
    .record(z.string(), z.unknown())
    .describe("Parsed frontmatter object"),
  hasFrontmatter: z.boolean().describe("Whether the document has frontmatter"),
  content: z.string().describe("Markdown content without frontmatter"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Regex to match YAML frontmatter at the beginning of a document.
 * Matches content between --- markers.
 */
const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/**
 * Parses YAML frontmatter from markdown content.
 */
function parseFrontmatter(markdown: string): {
  frontmatter: Record<string, unknown>;
  content: string;
  hasFrontmatter: boolean;
} {
  const match = markdown.match(FRONTMATTER_REGEX);

  if (!match) {
    return {
      frontmatter: {},
      content: markdown,
      hasFrontmatter: false,
    };
  }

  const frontmatterYaml = match[1];
  const content = markdown.slice(match[0].length);

  try {
    const parsed = yaml.load(frontmatterYaml ?? "");

    // Handle empty frontmatter or non-object types
    if (parsed === null || parsed === undefined) {
      return {
        frontmatter: {},
        content,
        hasFrontmatter: true,
      };
    }

    if (typeof parsed !== "object" || Array.isArray(parsed)) {
      throw createToolError({
        code: MARKDOWN_INVALID_FRONTMATTER,
        message: "Frontmatter must be a YAML object/dictionary",
      });
    }

    return {
      frontmatter: parsed as Record<string, unknown>,
      content,
      hasFrontmatter: true,
    };
  } catch (err) {
    if (err && typeof err === "object" && "code" in err) {
      throw err; // Re-throw our own errors
    }
    const message =
      err instanceof Error ? err.message : "Invalid YAML frontmatter";
    throw createToolError({
      code: MARKDOWN_INVALID_FRONTMATTER,
      message: `Invalid frontmatter: ${message}`,
    });
  }
}

/**
 * Serializes frontmatter object back to YAML.
 */
function serializeFrontmatter(frontmatter: Record<string, unknown>): string {
  if (Object.keys(frontmatter).length === 0) {
    return "";
  }

  const yamlStr = yaml.dump(frontmatter, {
    indent: 2,
    lineWidth: 80,
    noRefs: true,
    sortKeys: false,
  });

  return `---\n${yamlStr}---\n`;
}

/**
 * Applies updates and removals to frontmatter.
 */
function applyChanges(
  frontmatter: Record<string, unknown>,
  updates?: Record<string, unknown>,
  remove?: string[]
): Record<string, unknown> {
  const result = { ...frontmatter };

  // Apply updates
  if (updates) {
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined) {
        delete result[key];
      } else {
        result[key] = value;
      }
    }
  }

  // Remove specified fields
  if (remove) {
    for (const key of remove) {
      delete result[key];
    }
  }

  return result;
}

/**
 * Parses and optionally edits YAML frontmatter in markdown.
 */
function execute(input: Input, options?: Options): Output {
  const { frontmatter, content, hasFrontmatter } = parseFrontmatter(
    input.input
  );

  // Apply changes if provided
  const updatedFrontmatter = applyChanges(
    frontmatter,
    options?.updates,
    options?.remove
  );

  // Reconstruct the document
  const frontmatterStr = serializeFrontmatter(updatedFrontmatter);
  const output = frontmatterStr + content;

  return {
    output,
    frontmatter: updatedFrontmatter,
    hasFrontmatter:
      hasFrontmatter || Object.keys(updatedFrontmatter).length > 0,
    content,
  };
}

/**
 * Frontmatter Editor tool.
 * Parses and edits YAML frontmatter in markdown documents.
 */
export const frontmatterEditor = defineTool({
  meta: {
    id: "markdown/frontmatter-editor",
    name: "Frontmatter Editor",
    description:
      "Free online frontmatter editor — parse, add, update, and remove YAML frontmatter fields in Markdown documents instantly in your browser. No data is stored. Reads existing frontmatter, applies field updates, and reconstructs the document.",
    category: "markdown",
    subgroup: "Core",
    tier: ToolTier.CLIENT,
    keywords: [
      "markdown",
      "frontmatter",
      "yaml",
      "metadata",
      "parse",
      "edit",
      "md",
    ],
    examples: [
      {
        title: "Edit frontmatter fields",
        description: "Update YAML frontmatter in a Markdown document",
        input: "---\ntitle: My Post\ndate: 2024-01-01\n---\n\n# Content here",
        output:
          "---\ntitle: My Post\ndate: 2024-01-01T00:00:00.000Z\n---\n\n# Content here",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
