import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  style: z
    .enum(["standard", "minimal", "detailed"])
    .default("standard")
    .describe("Template style"),
});

const optionsSchema = z.object({
  projectName: z.string().default("Project").describe("Project name"),
  requireChecklist: z.boolean().default(true).describe("Include checklist"),
});

const outputSchema = z.object({
  output: z.string().describe("PR template content"),
  filename: z.string().describe("Suggested filename"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

const TEMPLATES: Record<
  string,
  (options: { projectName: string; requireChecklist: boolean }) => string
> = {
  standard: ({ projectName, requireChecklist }) => `## Description
<!-- Describe your changes in detail -->

## Related Issue
<!-- Link to the issue this PR addresses -->
Fixes #

## Type of Change
<!-- Mark the relevant option with an x -->
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?
<!-- Describe the tests you ran -->

${
  requireChecklist
    ? `## Checklist
- [ ] My code follows the ${projectName} style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
`
    : ""
}
## Screenshots (if applicable)
<!-- Add screenshots to help explain your changes -->
`,

  minimal: () => `## Summary
<!-- Brief description of changes -->

## Changes
-
-
-

## Testing
<!-- How was this tested? -->
`,

  detailed: ({ projectName, requireChecklist }) => `## Pull Request

### Description
<!-- Provide a detailed description of your changes -->

### Motivation and Context
<!-- Why is this change required? What problem does it solve? -->

### Related Issues
<!-- List any related issues -->
- Fixes #
- Related to #

### Type of Change
- [ ] 🐛 Bug fix
- [ ] ✨ New feature
- [ ] 💥 Breaking change
- [ ] 📝 Documentation
- [ ] 🎨 Style/formatting
- [ ] ♻️ Refactoring
- [ ] 🧪 Tests
- [ ] 🔧 Configuration

### Implementation Details
<!-- Technical details about your implementation -->

### Testing Strategy
<!-- How did you test your changes? -->

#### Test Cases
1.
2.
3.

${
  requireChecklist
    ? `### Checklist
#### Code Quality
- [ ] Code follows ${projectName} coding standards
- [ ] Self-review completed
- [ ] Code is well-documented

#### Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All tests pass locally

#### Documentation
- [ ] README updated (if needed)
- [ ] API documentation updated (if needed)
- [ ] Changelog updated (if needed)

#### Review
- [ ] Ready for review
- [ ] Requested reviewers assigned
`
    : ""
}
### Screenshots/Recordings
<!-- If applicable, add visual aids -->

### Additional Notes
<!-- Any additional information for reviewers -->
`,
};

/**
 * Generates GitHub PR templates.
 */
function execute(input: Input, options?: Options): Output {
  const projectName = options?.projectName ?? "Project";
  const requireChecklist = options?.requireChecklist ?? true;
  const template = TEMPLATES[input.style] ?? TEMPLATES.standard!;
  const output = template({ projectName, requireChecklist });

  return { output, filename: "PULL_REQUEST_TEMPLATE.md" };
}

/**
 * PR Template Generator tool.
 * Generates GitHub pull request templates.
 */
export const prTemplate = defineTool({
  meta: {
    id: "markdown/pr-template",
    name: "PR Template Generator",
    description:
      "Free online PR template generator — create GitHub pull request templates in standard, minimal, or detailed styles instantly in your browser. No data is stored. Includes checklists, type-of-change options, and testing sections.",
    category: "markdown",
    subgroup: "Additional",
    tier: ToolTier.CLIENT,
    keywords: ["markdown", "github", "pr", "pull-request", "template"],
    examples: [
      {
        title: "Generate a PR template",
        description: "Create a standard pull request template",
        input: { style: "standard" },
        output:
          "## Description\n<!-- Describe your changes in detail -->\n\n## Related Issue\n<!-- Link to the issue this PR addresses -->\nFixes #\n\n## Type of Change\n<!-- Mark the relevant option with an x -->\n- [ ] Bug fix (non-breaking change which fixes an issue)\n- [ ] New feature (non-breaking change which adds functionality)\n- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)\n- [ ] Documentation update\n\n## How Has This Been Tested?\n<!-- Describe the tests you ran -->\n\n## Checklist\n- [ ] My code follows the Project style guidelines\n- [ ] I have performed a self-review of my code\n- [ ] I have commented my code, particularly in hard-to-understand areas\n- [ ] I have made corresponding changes to the documentation\n- [ ] My changes generate no new warnings\n- [ ] I have added tests that prove my fix is effective or that my feature works\n- [ ] New and existing unit tests pass locally with my changes\n\n## Screenshots (if applicable)\n<!-- Add screenshots to help explain your changes -->\n",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
