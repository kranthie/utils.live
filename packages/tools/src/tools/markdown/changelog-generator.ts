import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  version: z.string().min(1).describe("Version number (e.g., 1.0.0)"),
  date: z.string().min(1).describe("Release date (e.g., 2024-01-15)"),
  changes: z
    .object({
      added: z.array(z.string()).optional().describe("New features"),
      changed: z
        .array(z.string())
        .optional()
        .describe("Changes in existing functionality"),
      deprecated: z
        .array(z.string())
        .optional()
        .describe("Soon-to-be removed features"),
      removed: z.array(z.string()).optional().describe("Removed features"),
      fixed: z.array(z.string()).optional().describe("Bug fixes"),
      security: z.array(z.string()).optional().describe("Security fixes"),
    })
    .describe("Changes by category"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated changelog section in markdown"),
});

const optionsSchema = z.object({
  linkBase: z
    .string()
    .optional()
    .describe("Base URL for version comparison links"),
  previousVersion: z
    .string()
    .optional()
    .describe("Previous version for comparison link"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Generates a changelog section for a version.
 */
function execute(input: Input, options?: Options): Output {
  const { version, date, changes } = input;
  const linkBase = options?.linkBase;
  const previousVersion = options?.previousVersion;

  const sections: string[] = [];

  // Version header with optional comparison link
  if (linkBase && previousVersion) {
    sections.push(
      `## [${version}](${linkBase}/compare/v${previousVersion}...v${version}) - ${date}`
    );
  } else {
    sections.push(`## [${version}] - ${date}`);
  }
  sections.push("");

  // Add each change category
  const categories: Array<{ key: keyof typeof changes; label: string }> = [
    { key: "added", label: "Added" },
    { key: "changed", label: "Changed" },
    { key: "deprecated", label: "Deprecated" },
    { key: "removed", label: "Removed" },
    { key: "fixed", label: "Fixed" },
    { key: "security", label: "Security" },
  ];

  for (const { key, label } of categories) {
    const items = changes[key];
    if (items && items.length > 0) {
      sections.push(`### ${label}`);
      sections.push("");
      for (const item of items) {
        sections.push(`- ${item}`);
      }
      sections.push("");
    }
  }

  return {
    output: sections.join("\n"),
  };
}

/**
 * Changelog Generator tool.
 * Generates changelog entries following Keep a Changelog format.
 */
export const changelogGenerator = defineTool({
  meta: {
    id: "markdown/changelog-generator",
    name: "Changelog Generator",
    description:
      "Free online changelog generator — create Keep a Changelog formatted version entries instantly in your browser. No data is stored. Supports Added, Changed, Deprecated, Removed, Fixed, and Security categories with optional version comparison links.",
    category: "markdown",
    subgroup: "Project Templates",
    tier: ToolTier.CLIENT,
    keywords: ["changelog", "release", "version", "history", "changes"],
    examples: [
      {
        title: "Generate a changelog entry",
        description: "Create a Keep a Changelog formatted version entry",
        input: {
          version: "1.2.0",
          date: "2024-03-15",
          changes: {
            added: ["Dark mode support", "Export to PDF"],
            fixed: ["Login timeout issue"],
          },
        },
        output:
          "## [1.2.0] - 2024-03-15\n\n### Added\n\n- Dark mode support\n- Export to PDF\n\n### Fixed\n\n- Login timeout issue\n",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
