import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  projectName: z.string().min(1).describe("Name of the project"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated CONTRIBUTING.md content"),
});

const optionsSchema = z.object({
  bugs: z.boolean().default(true).describe("Include bug reporting section"),
  features: z
    .boolean()
    .default(true)
    .describe("Include feature request section"),
  pullRequests: z
    .boolean()
    .default(true)
    .describe("Include pull request section"),
  codeStyle: z.boolean().default(true).describe("Include code style section"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Generates a CONTRIBUTING.md file.
 */
function execute(input: Input, options?: Options): Output {
  const { projectName } = input;
  const includeBugs = options?.bugs ?? true;
  const includeFeatures = options?.features ?? true;
  const includePRs = options?.pullRequests ?? true;
  const includeCodeStyle = options?.codeStyle ?? true;

  const sections: string[] = [];

  sections.push(`# Contributing to ${projectName}`);
  sections.push("");
  sections.push(
    `Thank you for your interest in contributing to ${projectName}! This document provides guidelines and steps for contributing.`
  );
  sections.push("");

  sections.push("## Table of Contents");
  sections.push("");
  if (includeBugs) sections.push("- [Reporting Bugs](#reporting-bugs)");
  if (includeFeatures)
    sections.push("- [Suggesting Features](#suggesting-features)");
  if (includePRs) sections.push("- [Pull Requests](#pull-requests)");
  if (includeCodeStyle) sections.push("- [Code Style](#code-style)");
  sections.push("");

  if (includeBugs) {
    sections.push("## Reporting Bugs");
    sections.push("");
    sections.push(
      "Before creating bug reports, please check the existing issues to avoid duplicates."
    );
    sections.push("");
    sections.push("When creating a bug report, please include:");
    sections.push("");
    sections.push("- **Clear title** describing the issue");
    sections.push("- **Steps to reproduce** the behavior");
    sections.push("- **Expected behavior** vs actual behavior");
    sections.push("- **Environment details** (OS, Node version, etc.)");
    sections.push("- **Screenshots** if applicable");
    sections.push("- **Code samples** that demonstrate the issue");
    sections.push("");
  }

  if (includeFeatures) {
    sections.push("## Suggesting Features");
    sections.push("");
    sections.push(
      "Feature suggestions are welcome! When suggesting a feature:"
    );
    sections.push("");
    sections.push("- **Check existing issues** to avoid duplicates");
    sections.push("- **Describe the use case** - what problem does it solve?");
    sections.push("- **Propose a solution** if you have one in mind");
    sections.push("- **Consider scope** - does it fit the project's goals?");
    sections.push("");
  }

  if (includePRs) {
    sections.push("## Pull Requests");
    sections.push("");
    sections.push("### Getting Started");
    sections.push("");
    sections.push("1. Fork the repository");
    sections.push(
      "2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/PROJECT.git`"
    );
    sections.push(
      "3. Create a branch: `git checkout -b feature/your-feature-name`"
    );
    sections.push("4. Make your changes");
    sections.push("5. Run tests: `npm test`");
    sections.push("6. Commit your changes: `git commit -m 'Add some feature'`");
    sections.push(
      "7. Push to the branch: `git push origin feature/your-feature-name`"
    );
    sections.push("8. Open a Pull Request");
    sections.push("");
    sections.push("### PR Guidelines");
    sections.push("");
    sections.push("- **One feature/fix per PR** - keep changes focused");
    sections.push("- **Write tests** for new functionality");
    sections.push("- **Update documentation** if needed");
    sections.push("- **Follow the code style** guidelines");
    sections.push("- **Write meaningful commit messages**");
    sections.push("");
  }

  if (includeCodeStyle) {
    sections.push("## Code Style");
    sections.push("");
    sections.push("Please follow these coding conventions:");
    sections.push("");
    sections.push("- Use consistent indentation (2 spaces)");
    sections.push("- Follow existing naming conventions");
    sections.push("- Add comments for complex logic");
    sections.push("- Keep functions small and focused");
    sections.push("- Write self-documenting code when possible");
    sections.push("");
    sections.push("### Linting");
    sections.push("");
    sections.push("Run the linter before committing:");
    sections.push("");
    sections.push("```bash");
    sections.push("npm run lint");
    sections.push("```");
    sections.push("");
  }

  sections.push("## Questions?");
  sections.push("");
  sections.push(
    "Feel free to open an issue if you have questions about contributing."
  );
  sections.push("");

  return {
    output: sections.join("\n"),
  };
}

/**
 * Contributing Guide tool.
 * Generates a CONTRIBUTING.md file for open source projects.
 */
export const contributingGuide = defineTool({
  meta: {
    id: "markdown/contributing-guide",
    name: "Contributing Guide",
    description:
      "Free online contributing guide generator — create a CONTRIBUTING.md file for open-source projects instantly in your browser. No data is stored. Includes sections for bug reporting, feature requests, pull requests, and code style guidelines.",
    category: "markdown",
    subgroup: "Project Templates",
    tier: ToolTier.CLIENT,
    keywords: ["contributing", "guide", "open-source", "documentation"],
    examples: [
      {
        title: "Generate a contributing guide",
        description: "Create a CONTRIBUTING.md for an open-source project",
        input: { projectName: "my-awesome-lib" },
        output:
          "# Contributing to my-awesome-lib\n\nThank you for your interest in contributing to my-awesome-lib! This document provides guidelines and steps for contributing.\n\n## Table of Contents\n\n- [Reporting Bugs](#reporting-bugs)\n- [Suggesting Features](#suggesting-features)\n- [Pull Requests](#pull-requests)\n- [Code Style](#code-style)\n\n## Reporting Bugs\n\nBefore creating bug reports, please check the existing issues to avoid duplicates.\n\nWhen creating a bug report, please include:\n\n- **Clear title** describing the issue\n- **Steps to reproduce** the behavior\n- **Expected behavior** vs actual behavior\n- **Environment details** (OS, Node version, etc.)\n- **Screenshots** if applicable\n- **Code samples** that demonstrate the issue\n\n## Suggesting Features\n\nFeature suggestions are welcome! When suggesting a feature:\n\n- **Check existing issues** to avoid duplicates\n- **Describe the use case** - what problem does it solve?\n- **Propose a solution** if you have one in mind\n- **Consider scope** - does it fit the project's goals?\n\n## Pull Requests\n\n### Getting Started\n\n1. Fork the repository\n2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/PROJECT.git`\n3. Create a branch: `git checkout -b feature/your-feature-name`\n4. Make your changes\n5. Run tests: `npm test`\n6. Commit your changes: `git commit -m 'Add some feature'`\n7. Push to the branch: `git push origin feature/your-feature-name`\n8. Open a Pull Request\n\n### PR Guidelines\n\n- **One feature/fix per PR** - keep changes focused\n- **Write tests** for new functionality\n- **Update documentation** if needed\n- **Follow the code style** guidelines\n- **Write meaningful commit messages**\n\n## Code Style\n\nPlease follow these coding conventions:\n\n- Use consistent indentation (2 spaces)\n- Follow existing naming conventions\n- Add comments for complex logic\n- Keep functions small and focused\n- Write self-documenting code when possible\n\n### Linting\n\nRun the linter before committing:\n\n```bash\nnpm run lint\n```\n\n## Questions?\n\nFeel free to open an issue if you have questions about contributing.\n",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
