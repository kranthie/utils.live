import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Dockerfile content to lint"),
});
const outputSchema = z.object({ output: z.string().describe("Lint results") });

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");
  const lines = text.split("\n");
  const issues: Array<{
    line: number;
    severity: string;
    message: string;
    rule: string;
  }> = [];

  let hasFrom = false;
  let lastInstruction = "";
  let runCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (!line || line.startsWith("#")) continue;
    const lineNum = i + 1;
    const instruction = line.split(/\s/)[0]!.toUpperCase();

    if (instruction === "FROM") {
      hasFrom = true;
      if (
        line.includes(":latest") ||
        (line.includes(":") === false && !line.includes(" AS "))
      ) {
        issues.push({
          line: lineNum,
          severity: "warning",
          message: "Avoid using 'latest' tag; pin to a specific version",
          rule: "DL3007",
        });
      }
    }

    if (!hasFrom && instruction !== "ARG" && instruction !== "FROM") {
      issues.push({
        line: lineNum,
        severity: "error",
        message: "First instruction must be FROM (or ARG before FROM)",
        rule: "DL3000",
      });
    }

    if (instruction === "RUN") {
      runCount++;
      if (
        line.includes("apt-get install") &&
        !line.includes("--no-install-recommends")
      ) {
        issues.push({
          line: lineNum,
          severity: "warning",
          message: "Use --no-install-recommends with apt-get install",
          rule: "DL3015",
        });
      }
      if (line.includes("apt-get update") && !line.includes("&&")) {
        issues.push({
          line: lineNum,
          severity: "warning",
          message:
            "Combine apt-get update with install in a single RUN to avoid cache issues",
          rule: "DL3009",
        });
      }
      if (line.includes("pip install") && !line.includes("--no-cache-dir")) {
        issues.push({
          line: lineNum,
          severity: "info",
          message: "Consider using --no-cache-dir with pip install",
          rule: "DL3042",
        });
      }
      if (line.includes("sudo")) {
        issues.push({
          line: lineNum,
          severity: "warning",
          message: "Avoid using sudo in Dockerfiles; use USER instead",
          rule: "DL3004",
        });
      }
      if (line.includes("curl") && line.includes("|") && line.includes("sh")) {
        issues.push({
          line: lineNum,
          severity: "warning",
          message:
            "Avoid piping curl to shell; download and verify files instead",
          rule: "DL4006",
        });
      }
    }

    if (
      instruction === "ADD" &&
      !line.includes(".tar") &&
      !line.includes("http")
    ) {
      issues.push({
        line: lineNum,
        severity: "warning",
        message: "Use COPY instead of ADD for simple file copying",
        rule: "DL3020",
      });
    }

    if (instruction === "EXPOSE" && line.match(/EXPOSE\s+\d+\/tcp/i)) {
      // OK
    }

    if (instruction === "WORKDIR" && !line.match(/WORKDIR\s+\//)) {
      issues.push({
        line: lineNum,
        severity: "warning",
        message: "WORKDIR should use absolute paths",
        rule: "DL3006",
      });
    }

    if (
      instruction === "ENV" &&
      line.includes("DEBIAN_FRONTEND=noninteractive")
    ) {
      issues.push({
        line: lineNum,
        severity: "info",
        message: "Consider using ARG for DEBIAN_FRONTEND instead of ENV",
        rule: "DL3005",
      });
    }

    if (lastInstruction === "RUN" && instruction === "RUN") {
      issues.push({
        line: lineNum,
        severity: "info",
        message: "Consider combining consecutive RUN commands with &&",
        rule: "DL3059",
      });
    }

    lastInstruction = instruction;
  }

  if (runCount > 10) {
    issues.push({
      line: 0,
      severity: "warning",
      message: `High number of RUN instructions (${runCount}). Consider combining them to reduce layers.`,
      rule: "DL3059",
    });
  }

  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;
  const infos = issues.filter((i) => i.severity === "info").length;

  const result: string[] = [
    `# Dockerfile Lint Results`,
    "",
    `Errors: ${errors} | Warnings: ${warnings} | Info: ${infos}`,
    "",
  ];
  if (issues.length === 0) {
    result.push("No issues found! Dockerfile looks good.");
  } else {
    for (const issue of issues) {
      const loc = issue.line > 0 ? `Line ${issue.line}` : "General";
      result.push(
        `[${issue.severity.toUpperCase()}] ${loc} (${issue.rule}): ${issue.message}`
      );
    }
  }

  return { output: result.join("\n") };
}

export const dockerfileLinter = defineTool({
  meta: {
    id: "devops/dockerfile-linter",
    name: "Dockerfile Linter",
    description:
      "Free online Dockerfile linter — check your Dockerfile for best-practice violations instantly in your browser. No data is stored. Detects :latest tags, sudo usage, ADD vs COPY, relative WORKDIR, apt-get cache issues, and consecutive RUN layers.",
    category: "devops",
    tier: ToolTier.CLIENT,
    keywords: [
      "docker",
      "dockerfile",
      "lint",
      "check",
      "best-practices",
      "hadolint",
      "security",
      "layers",
    ],
    examples: [
      {
        title: "Catch common Dockerfile anti-patterns",
        description:
          "Detect :latest tag, sudo, missing --no-install-recommends, ADD misuse, and relative WORKDIR",
        input:
          "FROM node:latest\nRUN sudo apt-get update\nRUN apt-get install -y curl\nADD . /app\nWORKDIR app",
        output:
          "# Dockerfile Lint Results\n\nErrors: 0 | Warnings: 6 | Info: 1\n\n[WARNING] Line 1 (DL3007): Avoid using 'latest' tag; pin to a specific version\n[WARNING] Line 2 (DL3009): Combine apt-get update with install in a single RUN to avoid cache issues\n[WARNING] Line 2 (DL3004): Avoid using sudo in Dockerfiles; use USER instead\n[WARNING] Line 3 (DL3015): Use --no-install-recommends with apt-get install\n[INFO] Line 3 (DL3059): Consider combining consecutive RUN commands with &&\n[WARNING] Line 4 (DL3020): Use COPY instead of ADD for simple file copying\n[WARNING] Line 5 (DL3006): WORKDIR should use absolute paths",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
