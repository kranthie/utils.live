import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  nodeModules: z.boolean().default(true).describe("node_modules/"),
  dist: z.boolean().default(true).describe("dist/ build output"),
  env: z.boolean().default(true).describe(".env files"),
  logs: z.boolean().default(true).describe("Log files"),
  coverage: z.boolean().default(true).describe("Test coverage"),
  ide: z.boolean().default(true).describe("IDE files (.idea, .vscode)"),
  os: z.boolean().default(true).describe("OS files (.DS_Store, Thumbs.db)"),
  cache: z.boolean().default(true).describe("Cache directories"),
  docker: z.boolean().default(false).describe("Docker files"),
  terraform: z.boolean().default(false).describe("Terraform files"),
  custom: z.string().default("").describe("Custom patterns (one per line)"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated .gitignore"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const sections: string[] = ["# Generated .gitignore", ""];

  if (input.nodeModules) {
    sections.push("# Dependencies");
    sections.push("node_modules/");
    sections.push("bower_components/");
    sections.push("");
  }
  if (input.dist) {
    sections.push("# Build output");
    sections.push("dist/");
    sections.push("build/");
    sections.push(".next/");
    sections.push("out/");
    sections.push("*.tsbuildinfo");
    sections.push("");
  }
  if (input.env) {
    sections.push("# Environment");
    sections.push(".env");
    sections.push(".env.local");
    sections.push(".env.*.local");
    sections.push("");
  }
  if (input.logs) {
    sections.push("# Logs");
    sections.push("*.log");
    sections.push("logs/");
    sections.push("npm-debug.log*");
    sections.push("");
  }
  if (input.coverage) {
    sections.push("# Coverage");
    sections.push("coverage/");
    sections.push(".nyc_output/");
    sections.push("");
  }
  if (input.ide) {
    sections.push("# IDE");
    sections.push(".idea/");
    sections.push(".vscode/");
    sections.push("*.swp");
    sections.push("*.swo");
    sections.push("*.iml");
    sections.push("");
  }
  if (input.os) {
    sections.push("# OS");
    sections.push(".DS_Store");
    sections.push("Thumbs.db");
    sections.push("Desktop.ini");
    sections.push("");
  }
  if (input.cache) {
    sections.push("# Cache");
    sections.push(".cache/");
    sections.push(".turbo/");
    sections.push(".parcel-cache/");
    sections.push("tmp/");
    sections.push("");
  }
  if (input.docker) {
    sections.push("# Docker");
    sections.push("docker-compose.override.yml");
    sections.push(".docker/");
    sections.push("");
  }
  if (input.terraform) {
    sections.push("# Terraform");
    sections.push(".terraform/");
    sections.push("*.tfstate");
    sections.push("*.tfstate.backup");
    sections.push("*.tfvars");
    sections.push("");
  }
  if (input.custom.trim()) {
    sections.push("# Custom");
    sections.push(input.custom.trim());
    sections.push("");
  }

  return { output: sections.join("\n").trimEnd() };
}

export const gitignoreBuilder = defineTool({
  meta: {
    id: "git/gitignore-builder",
    name: ".gitignore Builder",
    description:
      "Free online .gitignore builder — toggle checkboxes to build a .gitignore file for your project instantly in your browser. No data is stored. Covers node_modules, build output, env files, IDE settings, OS files, Docker, Terraform, and custom patterns.",
    category: "git",
    tier: ToolTier.CLIENT,
    keywords: [
      "gitignore",
      "git",
      "builder",
      "config",
      "node",
      "python",
      "docker",
      "terraform",
      "vscode",
    ],
    examples: [
      {
        title: "Node.js + Docker project",
        description:
          "Build a .gitignore for a Node.js project with Docker support, dependencies, build output, env files, IDE, and OS patterns",
        input: {
          nodeModules: true,
          dist: true,
          env: true,
          logs: false,
          coverage: false,
          ide: true,
          os: true,
          cache: false,
          docker: true,
          terraform: false,
          custom: "",
        },
        output:
          "# Generated .gitignore\n\n# Dependencies\nnode_modules/\nbower_components/\n\n# Build output\ndist/\nbuild/\n.next/\nout/\n*.tsbuildinfo\n\n# Environment\n.env\n.env.local\n.env.*.local\n\n# IDE\n.idea/\n.vscode/\n*.swp\n*.swo\n*.iml\n\n# OS\n.DS_Store\nThumbs.db\nDesktop.ini\n\n# Docker\ndocker-compose.override.yml\n.docker/",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
