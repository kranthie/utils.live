import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input1: z.string().describe("Original file content"),
  input2: z.string().describe("Modified file content"),
});
const outputSchema = z.object({
  original: z.string().describe("Original content"),
  modified: z.string().describe("Modified content"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  return { original: input.input1, modified: input.input2 };
}

export const gitDiffViewer = defineTool({
  meta: {
    id: "git/git-diff-viewer",
    name: "Git Diff Viewer",
    description:
      "Free online git diff viewer — compare two text versions side by side with additions, deletions, and unchanged lines highlighted instantly in your browser. No data is stored. Uses LCS-based algorithm for accurate visual diffing.",
    category: "git",
    tier: ToolTier.CLIENT,
    keywords: [
      "git",
      "diff",
      "compare",
      "unified",
      "patch",
      "merge",
      "changes",
      "side-by-side",
    ],
    examples: [
      {
        title: "Compare config file changes",
        description:
          "View a side-by-side diff showing port and debug flag changes in a config file",
        input: {
          input1:
            "const port = 3000;\nconst host = 'localhost';\nconst debug = false;",
          input2:
            "const port = 8080;\nconst host = 'localhost';\nconst debug = true;",
        },
        output: JSON.stringify({
          original:
            "const port = 3000;\nconst host = 'localhost';\nconst debug = false;",
          modified:
            "const port = 8080;\nconst host = 'localhost';\nconst debug = true;",
        }),
      },
    ],
    ui: { outputRenderer: "diff" },
  },
  inputSchema,
  outputSchema,
  execute,
});
