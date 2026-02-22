import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Kubernetes YAML manifest to validate"),
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

  // Basic structure checks
  if (!text.includes("apiVersion:")) errors.push("Missing 'apiVersion' field");
  if (!text.includes("kind:")) errors.push("Missing 'kind' field");
  if (!text.includes("metadata:")) errors.push("Missing 'metadata' field");

  const lines = text.split("\n");
  let hasName = false,
    hasNamespace = false,
    hasLabels = false;
  let hasResources = false,
    hasLivenessProbe = false,
    hasReadinessProbe = false;
  let hasSecurityContext = false,
    kind = "";

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i]!.trim();
    if (trimmed.startsWith("kind:")) kind = trimmed.split(":")[1]?.trim() ?? "";
    if (trimmed.startsWith("name:") && !hasName) hasName = true;
    if (trimmed.startsWith("namespace:")) hasNamespace = true;
    if (trimmed === "labels:") hasLabels = true;
    if (trimmed.startsWith("resources:")) hasResources = true;
    if (trimmed.startsWith("livenessProbe:")) hasLivenessProbe = true;
    if (trimmed.startsWith("readinessProbe:")) hasReadinessProbe = true;
    if (trimmed.startsWith("securityContext:")) hasSecurityContext = true;

    if (trimmed.includes("image:") && trimmed.includes(":latest")) {
      warnings.push(`Line ${i + 1}: Avoid using ':latest' image tag`);
    }
    if (trimmed === "privileged: true") {
      warnings.push(`Line ${i + 1}: privileged mode is a security risk`);
    }
    if (trimmed === "hostNetwork: true") {
      warnings.push(`Line ${i + 1}: hostNetwork usage is discouraged`);
    }
    if (
      trimmed.includes("runAsUser: 0") ||
      trimmed.includes("runAsRoot: true")
    ) {
      warnings.push(`Line ${i + 1}: Running as root is a security risk`);
    }
    if (/^\s+\t/.test(lines[i]!)) {
      errors.push(
        `Line ${i + 1}: Tabs detected - Kubernetes YAML requires spaces`
      );
    }
  }

  if (!hasName) errors.push("Missing 'name' in metadata");
  if (!hasNamespace) info.push("No namespace specified - will use 'default'");
  if (!hasLabels)
    warnings.push(
      "No labels defined - labels are recommended for organization"
    );

  const deploymentKinds = ["Deployment", "StatefulSet", "DaemonSet"];
  if (deploymentKinds.includes(kind)) {
    if (!hasResources)
      warnings.push(
        "No resource requests/limits defined - recommended for production"
      );
    if (!hasLivenessProbe)
      warnings.push("No livenessProbe defined - recommended for reliability");
    if (!hasReadinessProbe)
      warnings.push(
        "No readinessProbe defined - recommended for zero-downtime deploys"
      );
    if (!hasSecurityContext)
      info.push(
        "No securityContext defined - consider adding for security hardening"
      );
  }

  const result: string[] = [
    `# Kubernetes Manifest Validation`,
    "",
    `Kind: ${kind || "Unknown"}`,
    `Errors: ${errors.length} | Warnings: ${warnings.length}`,
    "",
  ];
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
  if (errors.length === 0) result.push("\nManifest structure is valid!");

  return { output: result.join("\n") };
}

export const k8sYamlValidator = defineTool({
  meta: {
    id: "devops/k8s-yaml-validator",
    name: "Kubernetes YAML Validator",
    description:
      "Free online Kubernetes YAML validator — lint your K8s manifests for missing fields and best-practice issues instantly in your browser. No data is stored. Checks apiVersion, kind, metadata, labels, resource limits, health probes, security context, and image tags.",
    category: "devops",
    tier: ToolTier.CLIENT,
    keywords: [
      "kubernetes",
      "k8s",
      "yaml",
      "validate",
      "manifest",
      "lint",
      "deployment",
      "security",
      "best-practices",
    ],
    examples: [
      {
        title: "Deployment missing probes + resource limits",
        description:
          "Validate a Deployment that uses :latest tag and lacks labels, resource limits, and health probes",
        input:
          "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: web\nspec:\n  template:\n    spec:\n      containers:\n        - name: web\n          image: nginx:latest",
        output:
          "# Kubernetes Manifest Validation\n\nKind: Deployment\nErrors: 0 | Warnings: 5\n\n## Warnings\n  - Line 10: Avoid using ':latest' image tag\n  - No labels defined - labels are recommended for organization\n  - No resource requests/limits defined - recommended for production\n  - No livenessProbe defined - recommended for reliability\n  - No readinessProbe defined - recommended for zero-downtime deploys\n\n## Info\n  - No namespace specified - will use 'default'\n  - No securityContext defined - consider adding for security hardening\n\nManifest structure is valid!",
      },
    ],
    ui: { inputLanguage: "yaml" },
  },
  inputSchema,
  outputSchema,
  execute,
});
