import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Description of the changes made"),
});
const optionsSchema = z.object({
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
    .describe("Commit type"),
  scope: z.string().default("").describe("Scope of the change"),
  breaking: z.boolean().default(false).describe("Breaking change"),
  body: z.string().default("").describe("Extended description"),
  footer: z.string().default("").describe("Footer (issue refs, etc.)"),
});
const outputSchema = z.object({
  output: z.string().describe("Formatted commit message"),
});

function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): z.infer<typeof outputSchema> {
  const desc = input.input.trim();
  if (!desc) throw new Error("Description cannot be empty");
  const type = options?.type ?? "feat";
  const scope = options?.scope?.trim() ?? "";
  const breaking = options?.breaking ?? false;
  const body = options?.body?.trim() ?? "";
  const footer = options?.footer?.trim() ?? "";

  let header = type;
  if (scope) header += `(${scope})`;
  if (breaking) header += "!";
  header += `: ${desc.charAt(0).toLowerCase() + desc.slice(1)}`;

  const parts = [header];
  if (body) parts.push("", body);
  if (breaking && !footer.includes("BREAKING CHANGE")) {
    parts.push("", `BREAKING CHANGE: ${desc}`);
  }
  if (footer) parts.push("", footer);

  return { output: parts.join("\n") };
}

export const gitCommitMessage = defineTool({
  meta: {
    id: "git/git-commit-message",
    name: "Git Commit Message",
    description:
      "Free online git commit message formatter — type a description and get a properly formatted conventional commit message instantly in your browser. No data is stored. Auto-lowercases the subject, supports all commit types, scopes, breaking changes, body, and footer.",
    category: "git",
    tier: ToolTier.CLIENT,
    keywords: [
      "git",
      "commit",
      "conventional",
      "message",
      "format",
      "subject",
      "semantic",
    ],
    examples: [
      {
        title: "Feature commit from description",
        description:
          "Type a change description and get a formatted conventional commit message with auto-lowercased subject",
        input: "Add dark mode toggle to user preferences",
        output: "feat: add dark mode toggle to user preferences",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
