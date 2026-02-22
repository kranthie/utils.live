import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("package.json content"),
});
const outputSchema = z.object({
  output: z.string().describe("Validation results"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");

  let pkg: Record<string, unknown>;
  try {
    pkg = JSON.parse(text) as Record<string, unknown>;
  } catch (e) {
    throw new Error(`Invalid JSON: ${(e as Error).message}`);
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const info: string[] = [];

  if (!pkg.name) errors.push("Missing required field 'name'");
  else if (typeof pkg.name !== "string") errors.push("'name' must be a string");
  else {
    if (/[A-Z]/.test(pkg.name))
      errors.push("'name' must not contain uppercase characters");
    if (/\s/.test(pkg.name)) errors.push("'name' must not contain spaces");
  }

  if (!pkg.version) errors.push("Missing required field 'version'");
  else if (!/^\d+\.\d+\.\d+/.test(pkg.version as string))
    errors.push("'version' must follow semver (x.y.z)");

  if (pkg.main && typeof pkg.main !== "string")
    errors.push("'main' must be a string");
  if (pkg.description && typeof pkg.description !== "string")
    warnings.push("'description' should be a string");
  if (!pkg.description) warnings.push("Missing 'description' field");
  if (!pkg.license) warnings.push("Missing 'license' field");
  if (!pkg.repository) warnings.push("Missing 'repository' field");
  if (!pkg.keywords) warnings.push("Missing 'keywords' field");

  if (pkg.scripts && typeof pkg.scripts === "object") {
    info.push(`Scripts: ${Object.keys(pkg.scripts).join(", ")}`);
  }
  if (pkg.dependencies && typeof pkg.dependencies === "object") {
    info.push(`Dependencies: ${Object.keys(pkg.dependencies).length}`);
  }
  if (pkg.devDependencies && typeof pkg.devDependencies === "object") {
    info.push(`Dev dependencies: ${Object.keys(pkg.devDependencies).length}`);
  }

  const lines: string[] = ["# package.json Validation", ""];
  lines.push(`Name: ${typeof pkg.name === "string" ? pkg.name : "N/A"}`);
  lines.push(
    `Version: ${typeof pkg.version === "string" ? pkg.version : "N/A"}`
  );
  lines.push(`Errors: ${errors.length} | Warnings: ${warnings.length}`);
  lines.push("");

  if (errors.length > 0) {
    lines.push("## Errors");
    errors.forEach((e) => lines.push(`  - ${e}`));
    lines.push("");
  }
  if (warnings.length > 0) {
    lines.push("## Warnings");
    warnings.forEach((w) => lines.push(`  - ${w}`));
    lines.push("");
  }
  if (info.length > 0) {
    lines.push("## Info");
    info.forEach((i) => lines.push(`  - ${i}`));
  }
  if (errors.length === 0) lines.push("\npackage.json is valid!");

  return { output: lines.join("\n") };
}

export const packageJsonValidator = defineTool({
  meta: {
    id: "code/package-json-validator",
    name: "package.json Validator",
    description:
      "Free online package.json validator — check for required fields, naming conventions, semver format, and common issues instantly in your browser. No data is stored. Reports errors, warnings, and package info.",
    category: "code",
    subgroup: "Package Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "package",
      "json",
      "npm",
      "validate",
      "node",
      "check",
      "lint",
      "dependencies",
    ],
    examples: [
      {
        title: "Validate a package.json",
        description: "Check for required fields and common issues",
        input:
          '{"name":"my-app","version":"1.0.0","scripts":{"dev":"next dev"}}',
        output:
          "# package.json Validation\n\nName: my-app\nVersion: 1.0.0\nErrors: 0 | Warnings: 4\n\n## Warnings\n  - Missing 'description' field\n  - Missing 'license' field\n  - Missing 'repository' field\n  - Missing 'keywords' field\n\n## Info\n  - Scripts: dev\n\npackage.json is valid!",
      },
    ],
    ui: { inputLanguage: "json" },
  },
  inputSchema,
  outputSchema,
  execute,
});
