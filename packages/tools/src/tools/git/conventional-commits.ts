import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  type: z
    .enum([
      "feat",
      "fix",
      "docs",
      "style",
      "refactor",
      "perf",
      "test",
      "build",
      "ci",
      "chore",
      "revert",
    ])
    .default("feat")
    .describe("Type"),
  scope: z.string().default("").describe("Scope"),
  description: z
    .string()
    .default("add new feature")
    .describe("Short description"),
  body: z.string().default("").describe("Body"),
  breaking: z.boolean().default(false).describe("Breaking change"),
  breakingDescription: z
    .string()
    .default("")
    .describe("Breaking change description"),
  issues: z.string().default("").describe("Related issues (e.g., #123, #456)"),
  coAuthors: z
    .string()
    .default("")
    .describe("Co-authors (name <email> per line)"),
});
const outputSchema = z.object({
  output: z.string().describe("Conventional commit message"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  let header = input.type;
  if (input.scope.trim()) header += `(${input.scope.trim()})`;
  if (input.breaking) header += "!";
  header += `: ${input.description}`;

  const parts = [header];
  if (input.body.trim()) parts.push("", input.body.trim());
  if (input.breaking && input.breakingDescription.trim())
    parts.push("", `BREAKING CHANGE: ${input.breakingDescription.trim()}`);
  if (input.issues.trim()) {
    const refs = input.issues
      .split(/[,\s]+/)
      .filter(Boolean)
      .map((i) => (i.startsWith("#") ? i : `#${i}`));
    parts.push("", `Refs: ${refs.join(", ")}`);
  }
  if (input.coAuthors.trim()) {
    for (const author of input.coAuthors.split("\n").filter(Boolean)) {
      parts.push("", `Co-authored-by: ${author.trim()}`);
    }
  }

  return { output: parts.join("\n") };
}

export const conventionalCommits = defineTool({
  meta: {
    id: "git/conventional-commits",
    name: "Conventional Commit Builder",
    description:
      "Free online conventional commit builder — compose properly formatted commit messages with type, scope, body, and footer instantly in your browser. No data is stored. Supports all commit types (feat, fix, docs, refactor, etc.), breaking changes, issue references, and co-authors.",
    category: "git",
    tier: ToolTier.CLIENT,
    keywords: [
      "git",
      "commit",
      "conventional",
      "builder",
      "message",
      "semantic-release",
      "changelog",
      "angular",
      "semver",
    ],
    examples: [
      {
        title: "Feature with scope and issue ref",
        description:
          "Build a commit message for a new auth feature referencing an issue",
        input: {
          type: "feat",
          scope: "auth",
          description: "add OAuth2 login with Google provider",
          issues: "#234",
        },
        output:
          "feat(auth): add OAuth2 login with Google provider\n\nRefs: #234",
      },
      {
        title: "Breaking change with body",
        description:
          "Build a breaking-change commit with body text and multiple issue refs",
        input: {
          type: "fix",
          scope: "api",
          description: "remove deprecated v1 endpoints",
          body: "Migration guide available at docs/migration.md",
          breaking: true,
          breakingDescription: "All /api/v1/* routes have been removed",
          issues: "#89, #102",
        },
        output:
          "fix(api)!: remove deprecated v1 endpoints\n\nMigration guide available at docs/migration.md\n\nBREAKING CHANGE: All /api/v1/* routes have been removed\n\nRefs: #89, #102",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
