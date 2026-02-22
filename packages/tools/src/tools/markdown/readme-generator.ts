import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  projectName: z.string().min(1).describe("Name of the project"),
  description: z.string().min(1).describe("Short description of the project"),
  features: z.array(z.string()).optional().describe("List of key features"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated README markdown"),
});

const optionsSchema = z.object({
  installation: z
    .boolean()
    .default(true)
    .describe("Include installation section"),
  usage: z.boolean().default(true).describe("Include usage section"),
  api: z.boolean().default(false).describe("Include API section"),
  contributing: z
    .boolean()
    .default(true)
    .describe("Include contributing section"),
  license: z.boolean().default(true).describe("Include license section"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function toCamelCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .map((word, index) =>
      index === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join("");
}

/**
 * Generates a README.md template for a project.
 */
function execute(input: Input, options?: Options): Output {
  const { projectName, description, features } = input;
  const includeInstallation = options?.installation ?? true;
  const includeUsage = options?.usage ?? true;
  const includeApi = options?.api ?? false;
  const includeContributing = options?.contributing ?? true;
  const includeLicense = options?.license ?? true;

  const sections: string[] = [];
  const pkgName = projectName.toLowerCase().replace(/\s+/g, "-");

  sections.push(`# ${projectName}`);
  sections.push("");
  sections.push(description);
  sections.push("");

  if (features && features.length > 0) {
    sections.push("## Features");
    sections.push("");
    for (const feature of features) {
      sections.push(`- ${feature}`);
    }
    sections.push("");
  }

  if (includeInstallation) {
    sections.push("## Installation");
    sections.push("");
    sections.push("```bash");
    sections.push(`npm install ${pkgName}`);
    sections.push("```");
    sections.push("");
  }

  if (includeUsage) {
    sections.push("## Usage");
    sections.push("");
    sections.push("```javascript");
    sections.push(`import { ${toCamelCase(projectName)} } from '${pkgName}';`);
    sections.push("");
    sections.push("// Your code here");
    sections.push("```");
    sections.push("");
  }

  if (includeApi) {
    sections.push("## API");
    sections.push("");
    sections.push("### Methods");
    sections.push("");
    sections.push("#### `methodName(options)`");
    sections.push("");
    sections.push("Description of the method.");
    sections.push("");
    sections.push("**Parameters:**");
    sections.push("");
    sections.push("| Name | Type | Description |");
    sections.push("|------|------|-------------|");
    sections.push("| `option1` | `string` | Description |");
    sections.push("| `option2` | `number` | Description |");
    sections.push("");
    sections.push("**Returns:** `ReturnType` - Description of return value");
    sections.push("");
  }

  if (includeContributing) {
    sections.push("## Contributing");
    sections.push("");
    sections.push(
      "Contributions are welcome! Please feel free to submit a Pull Request."
    );
    sections.push("");
    sections.push("1. Fork the repository");
    sections.push(
      "2. Create your feature branch (`git checkout -b feature/AmazingFeature`)"
    );
    sections.push(
      "3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)"
    );
    sections.push(
      "4. Push to the branch (`git push origin feature/AmazingFeature`)"
    );
    sections.push("5. Open a Pull Request");
    sections.push("");
  }

  if (includeLicense) {
    sections.push("## License");
    sections.push("");
    sections.push(
      "This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details."
    );
    sections.push("");
  }

  return {
    output: sections.join("\n"),
  };
}

/**
 * README Generator tool.
 * Generates a README.md template for projects.
 */
export const readmeGenerator = defineTool({
  meta: {
    id: "markdown/readme-generator",
    name: "README Generator",
    description:
      "Free online README generator — create a README.md template with installation, usage, API, contributing, and license sections instantly in your browser. No data is stored. Auto-generates import statements and npm install commands from your project name.",
    category: "markdown",
    subgroup: "Project Templates",
    tier: ToolTier.CLIENT,
    keywords: ["readme", "documentation", "markdown", "template", "project"],
    examples: [
      {
        title: "Generate a project README",
        description: "Create a README.md from project details",
        input: {
          projectName: "my-api",
          description: "A fast REST API framework",
          features: ["Automatic routing", "Middleware support"],
        },
        output:
          "# my-api\n\nA fast REST API framework\n\n## Features\n\n- Automatic routing\n- Middleware support\n\n## Installation\n\n```bash\nnpm install my-api\n```\n\n## Usage\n\n```javascript\nimport { myapi } from 'my-api';\n\n// Your code here\n```\n\n## Contributing\n\nContributions are welcome! Please feel free to submit a Pull Request.\n\n1. Fork the repository\n2. Create your feature branch (`git checkout -b feature/AmazingFeature`)\n3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)\n4. Push to the branch (`git push origin feature/AmazingFeature`)\n5. Open a Pull Request\n\n## License\n\nThis project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.\n",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
