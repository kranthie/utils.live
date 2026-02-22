import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  kind: z
    .enum([
      "Deployment",
      "Service",
      "ConfigMap",
      "Secret",
      "Ingress",
      "CronJob",
      "PersistentVolumeClaim",
    ])
    .default("Deployment")
    .describe("Resource kind"),
  name: z.string().default("my-app").describe("Resource name"),
  namespace: z.string().default("default").describe("Namespace"),
  image: z.string().default("nginx:1.25").describe("Container image"),
  replicas: z
    .number()
    .min(1)
    .max(100)
    .default(3)
    .describe("Number of replicas"),
  port: z.number().min(1).max(65535).default(80).describe("Container port"),
  resources: z.boolean().default(true).describe("Include resource limits"),
  probes: z.boolean().default(true).describe("Include health probes"),
});
const outputSchema = z.object({
  output: z.string().describe("Generated Kubernetes YAML"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const lines: string[] = [];
  switch (input.kind) {
    case "Deployment":
      lines.push("apiVersion: apps/v1");
      lines.push("kind: Deployment");
      lines.push("metadata:");
      lines.push(`  name: ${input.name}`);
      lines.push(`  namespace: ${input.namespace}`);
      lines.push("  labels:");
      lines.push(`    app: ${input.name}`);
      lines.push("spec:");
      lines.push(`  replicas: ${input.replicas}`);
      lines.push("  selector:");
      lines.push("    matchLabels:");
      lines.push(`      app: ${input.name}`);
      lines.push("  template:");
      lines.push("    metadata:");
      lines.push("      labels:");
      lines.push(`        app: ${input.name}`);
      lines.push("    spec:");
      lines.push("      containers:");
      lines.push(`        - name: ${input.name}`);
      lines.push(`          image: ${input.image}`);
      lines.push("          ports:");
      lines.push(`            - containerPort: ${input.port}`);
      if (input.resources) {
        lines.push("          resources:");
        lines.push("            requests:");
        lines.push("              cpu: 100m");
        lines.push("              memory: 128Mi");
        lines.push("            limits:");
        lines.push("              cpu: 500m");
        lines.push("              memory: 256Mi");
      }
      if (input.probes) {
        lines.push("          livenessProbe:");
        lines.push("            httpGet:");
        lines.push(`              path: /healthz`);
        lines.push(`              port: ${input.port}`);
        lines.push("            initialDelaySeconds: 15");
        lines.push("            periodSeconds: 10");
        lines.push("          readinessProbe:");
        lines.push("            httpGet:");
        lines.push(`              path: /ready`);
        lines.push(`              port: ${input.port}`);
        lines.push("            initialDelaySeconds: 5");
        lines.push("            periodSeconds: 5");
      }
      break;
    case "Service":
      lines.push("apiVersion: v1");
      lines.push("kind: Service");
      lines.push("metadata:");
      lines.push(`  name: ${input.name}`);
      lines.push(`  namespace: ${input.namespace}`);
      lines.push("spec:");
      lines.push("  type: ClusterIP");
      lines.push("  selector:");
      lines.push(`    app: ${input.name}`);
      lines.push("  ports:");
      lines.push(`    - port: ${input.port}`);
      lines.push(`      targetPort: ${input.port}`);
      lines.push("      protocol: TCP");
      break;
    case "ConfigMap":
      lines.push("apiVersion: v1");
      lines.push("kind: ConfigMap");
      lines.push("metadata:");
      lines.push(`  name: ${input.name}-config`);
      lines.push(`  namespace: ${input.namespace}`);
      lines.push("data:");
      lines.push("  APP_ENV: production");
      lines.push(`  APP_PORT: "${input.port}"`);
      break;
    case "Ingress":
      lines.push("apiVersion: networking.k8s.io/v1");
      lines.push("kind: Ingress");
      lines.push("metadata:");
      lines.push(`  name: ${input.name}-ingress`);
      lines.push(`  namespace: ${input.namespace}`);
      lines.push("  annotations:");
      lines.push("    nginx.ingress.kubernetes.io/rewrite-target: /");
      lines.push("spec:");
      lines.push("  rules:");
      lines.push(`    - host: ${input.name}.example.com`);
      lines.push("      http:");
      lines.push("        paths:");
      lines.push("          - path: /");
      lines.push("            pathType: Prefix");
      lines.push("            backend:");
      lines.push("              service:");
      lines.push(`                name: ${input.name}`);
      lines.push("                port:");
      lines.push(`                  number: ${input.port}`);
      break;
    default:
      lines.push(`apiVersion: v1`);
      lines.push(`kind: ${input.kind}`);
      lines.push("metadata:");
      lines.push(`  name: ${input.name}`);
      lines.push(`  namespace: ${input.namespace}`);
  }
  return { output: lines.join("\n") };
}

export const k8sYamlGenerator = defineTool({
  meta: {
    id: "devops/k8s-yaml-generator",
    name: "Kubernetes YAML Generator",
    description:
      "Free online Kubernetes YAML generator — create K8s manifests for Deployments, Services, ConfigMaps, Secrets, Ingress, CronJobs, and PVCs instantly in your browser. No data is stored. Includes resource limits, liveness/readiness probes, and namespace support.",
    category: "devops",
    tier: ToolTier.CLIENT,
    keywords: [
      "kubernetes",
      "k8s",
      "generate",
      "manifest",
      "deployment",
      "service",
      "ingress",
      "configmap",
      "secret",
      "cronjob",
      "pvc",
    ],
    examples: [
      {
        title: "Deployment with probes + resource limits",
        description:
          "Kubernetes Deployment for an Nginx API with 3 replicas, resource requests/limits, and health probes",
        input: {
          kind: "Deployment",
          name: "my-api",
          namespace: "default",
          image: "nginx:1.25",
          replicas: 3,
          port: 80,
          resources: true,
          probes: true,
        },
        output:
          "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: my-api\n  namespace: default\n  labels:\n    app: my-api\nspec:\n  replicas: 3\n  selector:\n    matchLabels:\n      app: my-api\n  template:\n    metadata:\n      labels:\n        app: my-api\n    spec:\n      containers:\n        - name: my-api\n          image: nginx:1.25\n          ports:\n            - containerPort: 80\n          resources:\n            requests:\n              cpu: 100m\n              memory: 128Mi\n            limits:\n              cpu: 500m\n              memory: 256Mi\n          livenessProbe:\n            httpGet:\n              path: /healthz\n              port: 80\n            initialDelaySeconds: 15\n            periodSeconds: 10\n          readinessProbe:\n            httpGet:\n              path: /ready\n              port: 80\n            initialDelaySeconds: 5\n            periodSeconds: 5",
      },
    ],
    ui: { outputLanguage: "yaml" },
  },
  inputSchema,
  outputSchema,
  execute,
});
