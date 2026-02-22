import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  type: z
    .enum([
      "feature",
      "bugfix",
      "hotfix",
      "release",
      "chore",
      "docs",
      "refactor",
      "test",
    ])
    .default("feature")
    .describe("Branch type"),
  description: z
    .string()
    .default("add user authentication")
    .describe("Short description of the work"),
  issueNumber: z
    .string()
    .default("")
    .describe("Issue/ticket number (e.g., JIRA-123, #42)"),
  convention: z
    .enum(["gitflow", "github", "simple", "jira"])
    .default("gitflow")
    .describe("Naming convention"),
});
const outputSchema = z.object({
  output: z.string().describe("Generated branch names"),
});

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);
}

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const slug = slugify(input.description);
  const issue = input.issueNumber.trim();
  const suggestions: string[] = [];

  switch (input.convention) {
    case "gitflow":
      suggestions.push(`${input.type}/${issue ? issue + "-" : ""}${slug}`);
      if (issue) suggestions.push(`${input.type}/${issue}`);
      break;
    case "github":
      suggestions.push(`${issue ? issue + "-" : ""}${slug}`);
      suggestions.push(`${input.type}/${slug}`);
      break;
    case "jira":
      if (issue) {
        suggestions.push(`${input.type}/${issue}-${slug}`);
        suggestions.push(`${issue}/${slug}`);
      }
      suggestions.push(`${input.type}/${slug}`);
      break;
    case "simple":
      suggestions.push(slug);
      suggestions.push(`${input.type}-${slug}`);
      break;
  }

  return {
    output: `# Branch Name Suggestions\n\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}`,
  };
}

export const gitBranchNamer = defineTool({
  meta: {
    id: "git/git-branch-namer",
    name: "Git Branch Namer",
    description:
      "Free online git branch name generator — create clean, consistent branch names from task descriptions instantly in your browser. No data is stored. Supports Gitflow, GitHub, Jira, and simple naming conventions with automatic slugification.",
    category: "git",
    tier: ToolTier.CLIENT,
    keywords: [
      "git",
      "branch",
      "name",
      "convention",
      "generate",
      "gitflow",
      "jira",
      "slug",
      "ticket",
    ],
    examples: [
      {
        title: "Gitflow feature with Jira ticket",
        description:
          "Generate Gitflow-style branch names for a feature with a Jira ticket number",
        input: {
          type: "feature",
          description: "add user authentication",
          issueNumber: "PROJ-123",
          convention: "gitflow",
        },
        output:
          "# Branch Name Suggestions\n\n1. feature/PROJ-123-add-user-authentication\n2. feature/PROJ-123",
      },
      {
        title: "GitHub-style bugfix branch",
        description:
          "Generate GitHub-style branch names for a bugfix with an issue number",
        input: {
          type: "bugfix",
          description: "fix login timeout on mobile",
          issueNumber: "#42",
          convention: "github",
        },
        output:
          "# Branch Name Suggestions\n\n1. #42-fix-login-timeout-on-mobile\n2. bugfix/fix-login-timeout-on-mobile",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
