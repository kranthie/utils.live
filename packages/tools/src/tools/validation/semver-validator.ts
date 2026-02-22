import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Semantic version to validate (e.g., '1.2.3')"),
});
const outputSchema = z.object({
  output: z.string().describe("Validation result"),
  isValid: z.boolean(),
  errors: z.array(z.string()).optional(),
});

export const semverValidator = defineTool({
  meta: {
    id: "validation/semver-validator",
    name: "SemVer Validator",
    description:
      "Free online semantic version validator — check if a version string follows SemVer 2.0 format instantly in your browser. No data is stored. Parses major, minor, patch, pre-release, and build metadata components.",
    category: "validation",
    subgroup: "Format Validators",
    tier: ToolTier.CLIENT,
    keywords: [
      "semver",
      "version",
      "semantic",
      "validate",
      "major",
      "minor",
      "patch",
      "release",
    ],
    examples: [
      {
        title: "Stable Release",
        description: "Validate a standard semantic version",
        input: "2.4.1",
        output: "Valid SemVer: 2.4.1\nMajor: 2\nMinor: 4\nPatch: 1",
      },
      {
        title: "Pre-release Version",
        description: "Validate a version with pre-release and build metadata",
        input: "1.0.0-beta.2+build.456",
        output:
          "Valid SemVer: 1.0.0-beta.2+build.456\nMajor: 1\nMinor: 0\nPatch: 0\nPre-release: beta.2\nBuild: build.456",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const ver = input.input.trim();
    const re =
      /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
    const match = re.exec(ver);
    if (match) {
      const major = match[1],
        minor = match[2],
        patch = match[3];
      const pre = match[4] || "";
      const build = match[5] || "";
      const parts = [`Major: ${major}`, `Minor: ${minor}`, `Patch: ${patch}`];
      if (pre) parts.push(`Pre-release: ${pre}`);
      if (build) parts.push(`Build: ${build}`);
      return {
        output: `Valid SemVer: ${ver}\n${parts.join("\n")}`,
        isValid: true,
      };
    }
    return {
      output: "Invalid semantic version format",
      isValid: false,
      errors: ["Expected format: MAJOR.MINOR.PATCH[-prerelease][+build]"],
    };
  },
});
