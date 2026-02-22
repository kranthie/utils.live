import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("CHANGELOG.md content"),
});
const outputSchema = z.object({
  output: z.string().describe("Parsed changelog in JSON format"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");

  const releases: Array<{
    version: string;
    date: string;
    changes: Record<string, string[]>;
  }> = [];
  let currentRelease: {
    version: string;
    date: string;
    changes: Record<string, string[]>;
  } | null = null;
  let currentSection = "Other";

  for (const line of text.split("\n")) {
    const trimmed = line.trim();

    // Version header: ## [1.0.0] - 2024-01-01 or ## 1.0.0 (2024-01-01)
    const versionMatch = trimmed.match(
      /^##\s+\[?v?(\d+\.\d+\.\d+[^\]]*)]?\s*[-()]?\s*([\d-]*)/
    );
    if (versionMatch) {
      if (currentRelease) releases.push(currentRelease);
      currentRelease = {
        version: versionMatch[1]!,
        date: versionMatch[2] || "Unknown",
        changes: {},
      };
      currentSection = "Other";
      continue;
    }

    // Section header: ### Added, ### Fixed, etc.
    const sectionMatch = trimmed.match(/^###\s+(.+)/);
    if (sectionMatch && currentRelease) {
      currentSection = sectionMatch[1]!.trim();
      continue;
    }

    // Change item: - something or * something
    const itemMatch = trimmed.match(/^[-*]\s+(.+)/);
    if (itemMatch && currentRelease) {
      if (!currentRelease.changes[currentSection])
        currentRelease.changes[currentSection] = [];
      currentRelease.changes[currentSection]!.push(itemMatch[1]!);
    }
  }

  if (currentRelease) releases.push(currentRelease);

  if (releases.length === 0)
    throw new Error("No version entries found in changelog");

  const result = {
    totalReleases: releases.length,
    latestVersion: releases[0]?.version ?? "unknown",
    releases,
  };

  return { output: JSON.stringify(result, null, 2) };
}

export const changelogParser = defineTool({
  meta: {
    id: "git/changelog-parser",
    name: "Changelog Parser",
    description:
      "Free online changelog parser — extract versions, dates, and changes from CHANGELOG.md into structured JSON instantly in your browser. No data is stored. Supports Keep a Changelog format, semver versions, and multiple section types (Added, Fixed, Changed, Removed).",
    category: "git",
    tier: ToolTier.CLIENT,
    keywords: [
      "changelog",
      "parse",
      "version",
      "release",
      "markdown",
      "keep-a-changelog",
      "semver",
      "release-notes",
    ],
    examples: [
      {
        title: "Multi-release Keep a Changelog",
        description:
          "Parse a CHANGELOG.md with two releases containing Added, Fixed, and Changed sections",
        input:
          "## [2.1.0] - 2024-03-15\n\n### Added\n- Dark mode support\n- Export to PDF\n\n### Fixed\n- Login timeout issue\n\n## [2.0.0] - 2024-01-10\n\n### Changed\n- Redesigned dashboard",
        output:
          '{\n  "totalReleases": 2,\n  "latestVersion": "2.1.0",\n  "releases": [\n    {\n      "version": "2.1.0",\n      "date": "2024-03-15",\n      "changes": {\n        "Added": [\n          "Dark mode support",\n          "Export to PDF"\n        ],\n        "Fixed": [\n          "Login timeout issue"\n        ]\n      }\n    },\n    {\n      "version": "2.0.0",\n      "date": "2024-01-10",\n      "changes": {\n        "Changed": [\n          "Redesigned dashboard"\n        ]\n      }\n    }\n  ]\n}',
      },
    ],
    ui: { inputLanguage: "markdown", outputLanguage: "json" },
  },
  inputSchema,
  outputSchema,
  execute,
});
