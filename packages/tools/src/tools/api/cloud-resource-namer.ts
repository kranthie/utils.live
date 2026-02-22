import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  provider: z
    .enum(["aws", "gcp", "azure", "generic"])
    .default("aws")
    .describe("Cloud provider"),
  project: z.string().default("myproject").describe("Project name"),
  environment: z
    .enum(["dev", "staging", "prod", "test"])
    .default("dev")
    .describe("Environment"),
  resourceType: z
    .enum([
      "bucket",
      "vm",
      "database",
      "queue",
      "function",
      "cluster",
      "vpc",
      "subnet",
      "role",
      "policy",
    ])
    .default("bucket")
    .describe("Resource type"),
  region: z.string().default("us-east-1").describe("Region/location"),
  suffix: z.string().default("").describe("Optional suffix"),
});
const outputSchema = z.object({
  output: z.string().describe("Generated resource name suggestions"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const p = input.project.toLowerCase().replace(/[^a-z0-9]/g, "");
  const env = input.environment;
  const rt = input.resourceType;
  const region = input.region.replace(/[^a-z0-9-]/g, "");
  const suffix =
    input.suffix
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "") || "";
  const suffixPart = suffix ? `-${suffix}` : "";

  const suggestions: string[] = [];
  switch (input.provider) {
    case "aws":
      suggestions.push(`${p}-${env}-${rt}${suffixPart}`);
      suggestions.push(`${p}-${rt}-${env}-${region}${suffixPart}`);
      suggestions.push(`${env}-${p}-${rt}${suffixPart}`);
      break;
    case "gcp":
      suggestions.push(`${p}-${env}-${rt}${suffixPart}`);
      suggestions.push(`${p}-${rt}-${env}${suffixPart}`);
      break;
    case "azure":
      suggestions.push(`${p}-${env}-${rt}${suffixPart}`);
      suggestions.push(`${rt}-${p}-${env}${suffixPart}`);
      suggestions.push(`rg-${p}-${env}`);
      break;
    default:
      suggestions.push(`${p}-${env}-${rt}${suffixPart}`);
      suggestions.push(`${env}-${p}-${rt}${suffixPart}`);
  }

  const lines = [
    "# Cloud Resource Name Suggestions",
    `# Provider: ${input.provider}`,
    "",
  ];
  suggestions.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  return { output: lines.join("\n") };
}

export const cloudResourceNamer = defineTool({
  meta: {
    id: "api/cloud-resource-namer",
    name: "Cloud Resource Namer",
    description:
      "Free online cloud resource name generator — create properly formatted resource names for AWS, GCP, and Azure instantly in your browser. No data is stored. Follows provider-specific naming conventions for buckets, VMs, databases, queues, and more.",
    category: "api",
    subgroup: "Cloud Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "cloud",
      "aws",
      "gcp",
      "azure",
      "naming",
      "resource",
      "convention",
      "infrastructure",
      "terraform",
      "iac",
    ],
    examples: [
      {
        title: "AWS Production S3 Bucket",
        description:
          "Generate AWS S3 bucket name suggestions for a production environment",
        input: {
          provider: "aws",
          project: "webapp",
          environment: "prod",
          resourceType: "bucket",
          region: "us-east-1",
          suffix: "",
        },
        output:
          "# Cloud Resource Name Suggestions\n# Provider: aws\n\n1. webapp-prod-bucket\n2. webapp-bucket-prod-us-east-1\n3. prod-webapp-bucket",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
