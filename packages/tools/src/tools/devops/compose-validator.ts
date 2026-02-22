import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("docker-compose YAML content"),
});
const outputSchema = z.object({
  output: z.string().describe("Validation results"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");
  const errors: string[] = [];
  const warnings: string[] = [];
  const info: string[] = [];

  // Basic YAML structure validation
  if (!text.includes("services:") && !text.includes("version:")) {
    errors.push("Missing 'services' key - not a valid docker-compose file");
  }

  const lines = text.split("\n");
  const services: string[] = [];
  let inServices = false;
  let currentService = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trim();

    if (trimmed === "services:") {
      inServices = true;
      continue;
    }
    if (trimmed.startsWith("version:")) {
      const ver = trimmed.replace("version:", "").trim().replace(/['"]/g, "");
      if (ver === "2" || ver === "2.0" || ver === "2.1") {
        warnings.push(
          `Line ${i + 1}: Version "${ver}" is outdated. Consider upgrading to version 3.x or removing version (Compose V2)`
        );
      }
      if (ver === "3" || ver.startsWith("3.")) {
        info.push(
          `Line ${i + 1}: Version ${ver} specified. Note: version is optional in Compose V2`
        );
      }
    }

    if (inServices && /^ {2}\w/.test(line) && trimmed.endsWith(":")) {
      currentService = trimmed.replace(":", "");
      services.push(currentService);
    }

    if (trimmed.startsWith("image:") && trimmed.includes(":latest")) {
      warnings.push(
        `Line ${i + 1}: Avoid using ':latest' tag for image in service${currentService ? ` '${currentService}'` : ""}`
      );
    }

    if (trimmed.startsWith("container_name:")) {
      info.push(
        `Line ${i + 1}: container_name specified for '${currentService}'. This prevents scaling.`
      );
    }

    if (trimmed === "privileged: true") {
      warnings.push(
        `Line ${i + 1}: privileged mode is enabled for '${currentService}'. This is a security risk.`
      );
    }

    if (trimmed.startsWith("ports:")) {
      // Check next lines for host port binding
      for (
        let j = i + 1;
        j < lines.length && lines[j]!.trim().startsWith("-");
        j++
      ) {
        const port = lines[j]!.trim().replace(/^-\s*/, "").replace(/['"]/g, "");
        if (port.match(/^\d+:\d+$/) && !port.startsWith("127.0.0.1")) {
          info.push(
            `Line ${j + 1}: Port ${port} binds to all interfaces. Consider binding to 127.0.0.1 for local-only access.`
          );
        }
      }
    }

    if (/^\s+\t|\t\s+/.test(line)) {
      errors.push(`Line ${i + 1}: Mixed tabs and spaces detected`);
    }
  }

  const result: string[] = ["# docker-compose Validation", ""];
  result.push(
    `Services found: ${services.length > 0 ? services.join(", ") : "none"}`
  );
  result.push(
    `Errors: ${errors.length} | Warnings: ${warnings.length} | Info: ${info.length}`
  );
  result.push("");

  if (errors.length > 0) {
    result.push("## Errors");
    errors.forEach((e) => result.push(`  - ${e}`));
    result.push("");
  }
  if (warnings.length > 0) {
    result.push("## Warnings");
    warnings.forEach((w) => result.push(`  - ${w}`));
    result.push("");
  }
  if (info.length > 0) {
    result.push("## Info");
    info.forEach((i) => result.push(`  - ${i}`));
  }
  if (errors.length === 0 && warnings.length === 0)
    result.push("No critical issues found!");

  return { output: result.join("\n") };
}

export const composeValidator = defineTool({
  meta: {
    id: "devops/compose-validator",
    name: "Docker Compose Validator",
    description:
      "Free online Docker Compose validator — lint your docker-compose.yaml for common issues instantly in your browser. No data is stored. Detects :latest tags, privileged mode, outdated versions, port binding risks, and mixed indentation.",
    category: "devops",
    tier: ToolTier.CLIENT,
    keywords: [
      "docker",
      "compose",
      "validate",
      "yaml",
      "check",
      "lint",
      "docker-compose",
      "security",
      "best-practices",
    ],
    examples: [
      {
        title: "Catch security and best-practice issues",
        description:
          "Detect :latest image tag, privileged mode, and port binding to all interfaces in a Compose file",
        input:
          'services:\n  web:\n    image: nginx:latest\n    ports:\n      - "80:80"\n    privileged: true',
        output:
          "# docker-compose Validation\n\nServices found: web\nErrors: 0 | Warnings: 2 | Info: 1\n\n## Warnings\n  - Line 3: Avoid using ':latest' tag for image in service 'web'\n  - Line 6: privileged mode is enabled for 'web'. This is a security risk.\n\n## Info\n  - Line 5: Port 80:80 binds to all interfaces. Consider binding to 127.0.0.1 for local-only access.",
      },
    ],
    ui: { inputLanguage: "yaml" },
  },
  inputSchema,
  outputSchema,
  execute,
});
