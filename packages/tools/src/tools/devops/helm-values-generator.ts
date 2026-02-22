import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  appName: z.string().default("my-app").describe("Application name"),
  image: z.string().default("nginx").describe("Container image"),
  tag: z.string().default("1.25").describe("Image tag"),
  replicas: z.number().min(1).max(100).default(3).describe("Replicas"),
  port: z.number().default(80).describe("Service port"),
  ingress: z.boolean().default(true).describe("Include ingress"),
  autoscaling: z.boolean().default(false).describe("Include HPA"),
  persistence: z.boolean().default(false).describe("Include PVC"),
});
const outputSchema = z.object({
  output: z.string().describe("Generated Helm values.yaml"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const lines: string[] = ["# Default values for " + input.appName, ""];
  lines.push("replicaCount: " + input.replicas);
  lines.push("");
  lines.push("image:");
  lines.push("  repository: " + input.image);
  lines.push("  tag: " + input.tag);
  lines.push("  pullPolicy: IfNotPresent");
  lines.push("");
  lines.push("service:");
  lines.push("  type: ClusterIP");
  lines.push("  port: " + input.port);
  lines.push("");
  lines.push("resources:");
  lines.push("  requests:");
  lines.push("    cpu: 100m");
  lines.push("    memory: 128Mi");
  lines.push("  limits:");
  lines.push("    cpu: 500m");
  lines.push("    memory: 256Mi");

  if (input.ingress) {
    lines.push("");
    lines.push("ingress:");
    lines.push("  enabled: true");
    lines.push("  className: nginx");
    lines.push("  hosts:");
    lines.push(`    - host: ${input.appName}.example.com`);
    lines.push("      paths:");
    lines.push("        - path: /");
    lines.push("          pathType: Prefix");
    lines.push("  tls: []");
  }

  if (input.autoscaling) {
    lines.push("");
    lines.push("autoscaling:");
    lines.push("  enabled: true");
    lines.push("  minReplicas: " + input.replicas);
    lines.push("  maxReplicas: " + input.replicas * 3);
    lines.push("  targetCPUUtilizationPercentage: 80");
  }

  if (input.persistence) {
    lines.push("");
    lines.push("persistence:");
    lines.push("  enabled: true");
    lines.push('  storageClass: ""');
    lines.push("  accessMode: ReadWriteOnce");
    lines.push("  size: 10Gi");
  }

  lines.push("");
  lines.push("nodeSelector: {}");
  lines.push("tolerations: []");
  lines.push("affinity: {}");

  return { output: lines.join("\n") };
}

export const helmValuesGenerator = defineTool({
  meta: {
    id: "devops/helm-values-generator",
    name: "Helm Values Generator",
    description:
      "Free online Helm values.yaml generator — create Kubernetes Helm chart values instantly in your browser. No data is stored. Supports replicas, ingress, HPA autoscaling, persistent volumes, resource limits, and node affinity.",
    category: "devops",
    tier: ToolTier.CLIENT,
    keywords: [
      "helm",
      "values",
      "kubernetes",
      "k8s",
      "generate",
      "chart",
      "ingress",
      "autoscaling",
      "hpa",
    ],
    examples: [
      {
        title: "API service with ingress + autoscaling",
        description:
          "Helm values for a 3-replica Nginx API with ingress routing and horizontal pod autoscaling",
        input: {
          appName: "my-api",
          image: "nginx",
          tag: "1.25",
          replicas: 3,
          port: 80,
          ingress: true,
          autoscaling: true,
          persistence: false,
        },
        output:
          "# Default values for my-api\n\nreplicaCount: 3\n\nimage:\n  repository: nginx\n  tag: 1.25\n  pullPolicy: IfNotPresent\n\nservice:\n  type: ClusterIP\n  port: 80\n\nresources:\n  requests:\n    cpu: 100m\n    memory: 128Mi\n  limits:\n    cpu: 500m\n    memory: 256Mi\n\ningress:\n  enabled: true\n  className: nginx\n  hosts:\n    - host: my-api.example.com\n      paths:\n        - path: /\n          pathType: Prefix\n  tls: []\n\nautoscaling:\n  enabled: true\n  minReplicas: 3\n  maxReplicas: 9\n  targetCPUUtilizationPercentage: 80\n\nnodeSelector: {}\ntolerations: []\naffinity: {}",
      },
    ],
    ui: { outputLanguage: "yaml" },
  },
  inputSchema,
  outputSchema,
  execute,
});
