import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  action: z
    .enum([
      "clone",
      "commit",
      "push",
      "pull",
      "branch",
      "merge",
      "rebase",
      "stash",
      "reset",
      "log",
      "diff",
      "tag",
      "cherry-pick",
      "bisect",
    ])
    .default("commit")
    .describe("Git action"),
  repository: z.string().default("").describe("Repository URL (for clone)"),
  branch: z.string().default("").describe("Branch name"),
  message: z.string().default("").describe("Commit/tag message"),
  remote: z.string().default("origin").describe("Remote name"),
  files: z.string().default("").describe("File paths (space-separated)"),
  flags: z.string().default("").describe("Additional flags"),
});
const outputSchema = z.object({
  output: z.string().describe("Generated git command"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const parts: string[] = ["git"];
  const branch = input.branch.trim();
  const msg = input.message.trim();
  const remote = input.remote.trim() || "origin";
  const files = input.files.trim();
  const flags = input.flags.trim();

  switch (input.action) {
    case "clone":
      parts.push("clone", input.repository.trim() || "<repository-url>");
      if (branch) parts.push("-b", branch);
      break;
    case "commit":
      if (files) parts.push("add", files, "&&", "git");
      parts.push("commit");
      if (msg) parts.push("-m", `"${msg}"`);
      break;
    case "push":
      parts.push("push", remote);
      if (branch) parts.push(branch);
      break;
    case "pull":
      parts.push("pull", remote);
      if (branch) parts.push(branch);
      break;
    case "branch":
      parts.push("branch");
      if (branch) parts.push(branch);
      break;
    case "merge":
      parts.push("merge");
      if (branch) parts.push(branch);
      break;
    case "rebase":
      parts.push("rebase");
      if (branch) parts.push(branch);
      break;
    case "stash":
      parts.push("stash");
      if (msg) parts.push("push", "-m", `"${msg}"`);
      break;
    case "reset":
      parts.push("reset");
      if (branch) parts.push(branch);
      break;
    case "log":
      parts.push("log", "--oneline", "--graph");
      if (branch) parts.push(branch);
      break;
    case "diff":
      parts.push("diff");
      if (branch) parts.push(branch);
      if (files) parts.push("--", files);
      break;
    case "tag":
      parts.push("tag");
      if (branch) parts.push(branch);
      if (msg) parts.push("-m", `"${msg}"`);
      break;
    case "cherry-pick":
      parts.push("cherry-pick");
      if (branch) parts.push(branch);
      break;
    case "bisect":
      parts.push("bisect", "start");
      break;
  }

  if (flags) parts.push(flags);

  return { output: parts.join(" ") };
}

export const gitCommandBuilder = defineTool({
  meta: {
    id: "git/git-command-builder",
    name: "Git Command Builder",
    description:
      "Free online git command builder — visually compose git commands by selecting actions and filling in parameters instantly in your browser. No data is stored. Supports clone, commit, push, pull, merge, rebase, stash, reset, log, diff, tag, cherry-pick, and bisect.",
    category: "git",
    tier: ToolTier.CLIENT,
    keywords: [
      "git",
      "command",
      "builder",
      "generate",
      "clone",
      "push",
      "pull",
      "merge",
      "rebase",
      "stash",
      "cherry-pick",
    ],
    examples: [
      {
        title: "Stage files and commit",
        description:
          "Build a command to stage specific files and commit with a message",
        input: {
          action: "commit",
          files: "src/auth.ts src/login.ts",
          message: "add OAuth2 login flow",
        },
        output:
          'git add src/auth.ts src/login.ts && git commit -m "add OAuth2 login flow"',
      },
      {
        title: "Shallow clone with branch",
        description:
          "Build a shallow clone command targeting a specific branch",
        input: {
          action: "clone",
          repository: "https://github.com/user/repo.git",
          branch: "develop",
          flags: "--depth 1",
        },
        output:
          "git clone https://github.com/user/repo.git -b develop --depth 1",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
