import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  language: z
    .enum([
      "node",
      "python",
      "java",
      "go",
      "rust",
      "ruby",
      "csharp",
      "php",
      "swift",
      "kotlin",
    ])
    .default("node")
    .describe("Primary language/framework"),
  ide: z
    .enum(["none", "vscode", "intellij", "vim", "emacs"])
    .default("vscode")
    .describe("IDE/Editor"),
  os: z
    .enum(["all", "macos", "windows", "linux"])
    .default("all")
    .describe("Operating system"),
  extras: z
    .boolean()
    .default(true)
    .describe("Include common extras (.env, logs, etc.)"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated .gitignore content"),
});

const TEMPLATES: Record<string, string[]> = {
  node: [
    "node_modules/",
    "dist/",
    "build/",
    ".next/",
    ".nuxt/",
    "out/",
    "coverage/",
    "*.tsbuildinfo",
    ".turbo/",
    ".vercel/",
    ".output/",
    "*.js.map",
  ],
  python: [
    "__pycache__/",
    "*.py[cod]",
    "*$py.class",
    "*.so",
    ".Python",
    "env/",
    "venv/",
    ".venv/",
    "build/",
    "dist/",
    "*.egg-info/",
    ".eggs/",
    "*.egg",
    ".mypy_cache/",
    ".pytest_cache/",
  ],
  java: [
    "*.class",
    "*.jar",
    "*.war",
    "*.ear",
    "target/",
    "build/",
    ".gradle/",
    "gradle-app.setting",
    "!gradle-wrapper.jar",
    "*.log",
  ],
  go: [
    "*.exe",
    "*.exe~",
    "*.dll",
    "*.so",
    "*.dylib",
    "*.test",
    "*.out",
    "vendor/",
    "go.work",
  ],
  rust: ["target/", "Cargo.lock", "**/*.rs.bk"],
  ruby: [
    "*.gem",
    "*.rbc",
    "/.config",
    "/coverage/",
    "/InstalledFiles",
    "/pkg/",
    "/spec/reports/",
    "/test/tmp/",
    "/tmp/",
    "vendor/bundle/",
    ".bundle/",
  ],
  csharp: [
    "bin/",
    "obj/",
    "*.user",
    "*.suo",
    "*.userosscache",
    "*.sln.docstates",
    "[Dd]ebug/",
    "[Rr]elease/",
    "*.nupkg",
    "packages/",
    "*.DotSettings.user",
  ],
  php: [
    "vendor/",
    "node_modules/",
    ".env",
    "composer.phar",
    "*.cache",
    "storage/framework/",
    "public/hot",
    "public/storage",
  ],
  swift: [
    ".build/",
    "Packages/",
    "*.xcodeproj",
    "xcuserdata/",
    "DerivedData/",
    ".swiftpm/",
  ],
  kotlin: [
    "*.class",
    "*.jar",
    "*.war",
    "build/",
    ".gradle/",
    "out/",
    ".kotlin/",
  ],
};

const IDE_TEMPLATES: Record<string, string[]> = {
  vscode: [
    ".vscode/*",
    "!.vscode/settings.json",
    "!.vscode/tasks.json",
    "!.vscode/launch.json",
    "!.vscode/extensions.json",
    "*.code-workspace",
  ],
  intellij: [".idea/", "*.iml", "*.iws", "*.ipr", "out/", ".idea_modules/"],
  vim: ["*.swp", "*.swo", "*~", "Session.vim", ".netrwhist", "tags"],
  emacs: ["*~", "\\#*\\#", "*.elc", ".dir-locals.el", "auto-save-list"],
};

const OS_TEMPLATES: Record<string, string[]> = {
  macos: [
    ".DS_Store",
    ".AppleDouble",
    ".LSOverride",
    "._*",
    ".Spotlight-V100",
    ".Trashes",
    "Icon\r",
  ],
  windows: [
    "Thumbs.db",
    "Thumbs.db:encryptable",
    "ehthumbs.db",
    "*.stackdump",
    "[Dd]esktop.ini",
    "$RECYCLE.BIN/",
  ],
  linux: ["*~", ".fuse_hidden*", ".directory", ".Trash-*", ".nfs*"],
};

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const sections: string[] = [];

  // Language
  const langRules = TEMPLATES[input.language] ?? [];
  sections.push(
    `# ${input.language.charAt(0).toUpperCase() + input.language.slice(1)}`
  );
  sections.push(langRules.join("\n"));

  // IDE
  if (input.ide !== "none") {
    sections.push(
      `\n# ${input.ide.charAt(0).toUpperCase() + input.ide.slice(1)}`
    );
    sections.push((IDE_TEMPLATES[input.ide] ?? []).join("\n"));
  }

  // OS
  if (input.os === "all") {
    for (const [osName, rules] of Object.entries(OS_TEMPLATES)) {
      sections.push(`\n# ${osName.charAt(0).toUpperCase() + osName.slice(1)}`);
      sections.push(rules.join("\n"));
    }
  } else {
    sections.push(
      `\n# ${input.os.charAt(0).toUpperCase() + input.os.slice(1)}`
    );
    sections.push((OS_TEMPLATES[input.os] ?? []).join("\n"));
  }

  // Extras
  if (input.extras) {
    sections.push("\n# Environment & Secrets");
    sections.push(".env\n.env.local\n.env.*.local\n.env.production");
    sections.push("\n# Logs");
    sections.push(
      "logs/\n*.log\nnpm-debug.log*\nyarn-debug.log*\nyarn-error.log*"
    );
    sections.push("\n# Testing");
    sections.push("coverage/\n.nyc_output/");
    sections.push("\n# Misc");
    sections.push(".cache/\ntmp/\ntemp/");
  }

  return { output: sections.join("\n") };
}

// FIXME(category-mismatch): Tool belongs in 'code' category, not 'api'. Tracked in DC-006.
export const gitignoreGenerator = defineTool({
  meta: {
    id: "api/gitignore-generator",
    name: ".gitignore Generator",
    description:
      "Free online .gitignore generator — create .gitignore files for Node.js, Python, Java, Go, Rust, Ruby, and more instantly in your browser. No data is stored. Includes IDE-specific rules, OS files, and common extras like .env and log files.",
    category: "api",
    subgroup: "HTTP Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "gitignore",
      "git",
      "ignore",
      "generate",
      "template",
      "node",
      "python",
      "java",
      "vscode",
      "ide",
    ],
    examples: [
      {
        title: "Node.js with VS Code on macOS",
        description:
          "Generate a .gitignore for a Node.js project using VS Code on macOS",
        input: { language: "node", ide: "vscode", os: "macos", extras: true },
        output:
          "# Node\nnode_modules/\ndist/\nbuild/\n.next/\n.nuxt/\nout/\ncoverage/\n*.tsbuildinfo\n.turbo/\n.vercel/\n.output/\n*.js.map\n\n# Vscode\n.vscode/*\n!.vscode/settings.json\n!.vscode/tasks.json\n!.vscode/launch.json\n!.vscode/extensions.json\n*.code-workspace\n\n# Macos\n.DS_Store\n.AppleDouble\n.LSOverride\n._*\n.Spotlight-V100\n.Trashes\nIcon\r\n\n# Environment & Secrets\n.env\n.env.local\n.env.*.local\n.env.production\n\n# Logs\nlogs/\n*.log\nnpm-debug.log*\nyarn-debug.log*\nyarn-error.log*\n\n# Testing\ncoverage/\n.nyc_output/\n\n# Misc\n.cache/\ntmp/\ntemp/",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
