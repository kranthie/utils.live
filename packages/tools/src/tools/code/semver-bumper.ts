import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Current semantic version (e.g., 1.2.3)"),
});
const optionsSchema = z.object({
  bump: z
    .enum([
      "major",
      "minor",
      "patch",
      "premajor",
      "preminor",
      "prepatch",
      "prerelease",
    ])
    .default("patch")
    .describe("Bump type"),
  prerelease: z.string().default("beta").describe("Prerelease identifier"),
});
const outputSchema = z.object({
  output: z.string().describe("Bumped version and info"),
});

function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): z.infer<typeof outputSchema> {
  const ver = input.input.trim().replace(/^v/, "");
  if (!ver) throw new Error("Input cannot be empty");

  const match = ver.match(
    /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.]+))?(?:\+(.+))?$/
  );
  if (!match)
    throw new Error(
      `Invalid semver: "${ver}". Expected format: major.minor.patch[-prerelease][+build]`
    );

  let major = parseInt(match[1]!, 10);
  let minor = parseInt(match[2]!, 10);
  let patch = parseInt(match[3]!, 10);
  let pre = match[4] ?? "";
  const bump = options?.bump ?? "patch";
  const preId = options?.prerelease ?? "beta";

  switch (bump) {
    case "major":
      major++;
      minor = 0;
      patch = 0;
      pre = "";
      break;
    case "minor":
      minor++;
      patch = 0;
      pre = "";
      break;
    case "patch":
      if (pre) {
        pre = "";
      } else {
        patch++;
      }
      break;
    case "premajor":
      major++;
      minor = 0;
      patch = 0;
      pre = `${preId}.0`;
      break;
    case "preminor":
      minor++;
      patch = 0;
      pre = `${preId}.0`;
      break;
    case "prepatch":
      patch++;
      pre = `${preId}.0`;
      break;
    case "prerelease": {
      if (pre) {
        const parts = pre.split(".");
        const num = parseInt(parts[parts.length - 1]!, 10);
        if (!isNaN(num)) parts[parts.length - 1] = String(num + 1);
        else parts.push("1");
        pre = parts.join(".");
      } else {
        patch++;
        pre = `${preId}.0`;
      }
      break;
    }
  }

  const newVersion = `${major}.${minor}.${patch}${pre ? `-${pre}` : ""}`;

  const lines: string[] = [];
  lines.push(`Current: ${ver}`);
  lines.push(`Bump:    ${bump}`);
  lines.push(`New:     ${newVersion}`);
  lines.push("");
  lines.push(`v${newVersion}`);

  return { output: lines.join("\n") };
}

export const semverBumper = defineTool({
  meta: {
    id: "code/semver-bumper",
    name: "Semver Bumper",
    description:
      "Free online semver version bumper — increment major, minor, patch, or prerelease version numbers following semantic versioning rules instantly in your browser. No data is stored.",
    category: "code",
    subgroup: "Version & Conversion",
    tier: ToolTier.CLIENT,
    keywords: ["semver", "version", "bump", "major", "minor", "patch"],
    examples: [
      {
        title: "Bump patch version",
        description: "Increment the patch version of a semver string",
        input: "2.3.1",
        output: "Current: 2.3.1\nBump:    patch\nNew:     2.3.2\n\nv2.3.2",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
