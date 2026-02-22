import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  type: z
    .enum(["bug", "feature", "question", "blank"])
    .default("bug")
    .describe("Issue template type"),
});

const optionsSchema = z.object({
  projectName: z.string().default("Project").describe("Project name"),
  includeLabels: z.boolean().default(true).describe("Include suggested labels"),
});

const outputSchema = z.object({
  output: z.string().describe("Issue template content"),
  filename: z.string().describe("Suggested filename"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

const TEMPLATES: Record<string, (projectName: string) => string> = {
  bug: (projectName) => `---
name: Bug Report
about: Report a bug in ${projectName}
title: "[BUG] "
labels: bug
assignees: ''
---

## Bug Description
A clear and concise description of what the bug is.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
A clear and concise description of what you expected to happen.

## Actual Behavior
A clear and concise description of what actually happened.

## Screenshots
If applicable, add screenshots to help explain your problem.

## Environment
- OS: [e.g., Windows 11, macOS 14, Ubuntu 22.04]
- Browser: [e.g., Chrome 120, Firefox 121]
- Version: [e.g., 1.0.0]

## Additional Context
Add any other context about the problem here.
`,

  feature: (projectName) => `---
name: Feature Request
about: Suggest a new feature for ${projectName}
title: "[FEATURE] "
labels: enhancement
assignees: ''
---

## Feature Description
A clear and concise description of the feature you'd like.

## Problem Statement
What problem does this feature solve?

## Proposed Solution
Describe the solution you'd like.

## Alternatives Considered
Describe any alternative solutions or features you've considered.

## Additional Context
Add any other context, mockups, or screenshots about the feature request here.
`,

  question: (projectName) => `---
name: Question
about: Ask a question about ${projectName}
title: "[QUESTION] "
labels: question
assignees: ''
---

## Question
Your question here.

## Context
Provide any relevant context for your question.

## What I've Tried
Describe what you've already tried or researched.
`,

  blank: () => `---
name: Blank Issue
about: Create a blank issue
title: ''
labels: ''
assignees: ''
---

`,
};

/**
 * Generates GitHub issue templates.
 */
function execute(input: Input, options?: Options): Output {
  const projectName = options?.projectName ?? "Project";
  const template = TEMPLATES[input.type] ?? TEMPLATES.blank!;
  let output = template(projectName);

  if (!options?.includeLabels) {
    output = output.replace(/labels:.*\n/g, "labels: ''\n");
  }

  const filename =
    input.type === "blank"
      ? "ISSUE_TEMPLATE.md"
      : `ISSUE_TEMPLATE/${input.type}_report.md`;

  return { output, filename };
}

/**
 * Issue Template Generator tool.
 * Generates GitHub issue templates.
 */
export const issueTemplate = defineTool({
  meta: {
    id: "markdown/issue-template",
    name: "Issue Template Generator",
    description:
      "Free online GitHub issue template generator — create bug report, feature request, question, and blank issue templates instantly in your browser. No data is stored. Generates YAML frontmatter with labels and assignee fields.",
    category: "markdown",
    subgroup: "Additional",
    tier: ToolTier.CLIENT,
    keywords: ["markdown", "github", "issue", "template"],
    examples: [
      {
        title: "Generate a bug report template",
        description: "Create a GitHub issue template for bug reports",
        input: { type: "bug" },
        output:
          "---\nname: Bug Report\nabout: Report a bug in Project\ntitle: \"[BUG] \"\nlabels: bug\nassignees: ''\n---\n\n## Bug Description\nA clear and concise description of what the bug is.\n\n## Steps to Reproduce\n1. Go to '...'\n2. Click on '...'\n3. Scroll down to '...'\n4. See error\n\n## Expected Behavior\nA clear and concise description of what you expected to happen.\n\n## Actual Behavior\nA clear and concise description of what actually happened.\n\n## Screenshots\nIf applicable, add screenshots to help explain your problem.\n\n## Environment\n- OS: [e.g., Windows 11, macOS 14, Ubuntu 22.04]\n- Browser: [e.g., Chrome 120, Firefox 121]\n- Version: [e.g., 1.0.0]\n\n## Additional Context\nAdd any other context about the problem here.\n",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
