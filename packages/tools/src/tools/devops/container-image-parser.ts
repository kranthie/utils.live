import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z
    .string()
    .describe("Container image reference (e.g., registry/name:tag)"),
});
const outputSchema = z.object({
  output: z.string().describe("Parsed image components"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");

  let registry = "docker.io";
  let namespace = "library";
  let name = "";
  let tag = "latest";
  let digest = "";

  let ref = text;

  // Extract digest
  const digestIdx = ref.indexOf("@");
  if (digestIdx > 0) {
    digest = ref.substring(digestIdx + 1);
    ref = ref.substring(0, digestIdx);
  }

  // Extract tag
  const tagIdx = ref.lastIndexOf(":");
  if (tagIdx > 0 && !ref.substring(tagIdx).includes("/")) {
    tag = ref.substring(tagIdx + 1);
    ref = ref.substring(0, tagIdx);
  }

  // Parse registry/namespace/name
  const parts = ref.split("/");
  if (parts.length === 1) {
    name = parts[0]!;
  } else if (parts.length === 2) {
    if (
      parts[0]!.includes(".") ||
      parts[0]!.includes(":") ||
      parts[0] === "localhost"
    ) {
      registry = parts[0]!;
      name = parts[1]!;
    } else {
      namespace = parts[0]!;
      name = parts[1]!;
    }
  } else {
    registry = parts[0]!;
    namespace = parts.slice(1, -1).join("/");
    name = parts[parts.length - 1]!;
  }

  const fullRef = `${registry}/${namespace}/${name}:${tag}${digest ? "@" + digest : ""}`;
  const result = {
    registry,
    namespace,
    name,
    tag,
    digest: digest || undefined,
    fullReference: fullRef,
  };

  return { output: JSON.stringify(result, null, 2) };
}

export const containerImageParser = defineTool({
  meta: {
    id: "devops/container-image-parser",
    name: "Container Image Parser",
    description:
      "Free online container image reference parser — break down Docker and OCI image strings into registry, namespace, name, tag, and digest instantly in your browser. No data is stored. Supports Docker Hub, GHCR, ECR, GCR, and custom registries.",
    category: "devops",
    tier: ToolTier.CLIENT,
    keywords: [
      "docker",
      "container",
      "image",
      "parse",
      "registry",
      "tag",
      "oci",
      "docker-hub",
      "ghcr",
      "ecr",
      "gcr",
      "digest",
    ],
    examples: [
      {
        title: "GHCR private registry image",
        description:
          "Parse a GitHub Container Registry image reference into registry, namespace, name, and tag",
        input: "ghcr.io/myorg/api-server:v2.1.0",
        output:
          '{\n  "registry": "ghcr.io",\n  "namespace": "myorg",\n  "name": "api-server",\n  "tag": "v2.1.0",\n  "fullReference": "ghcr.io/myorg/api-server:v2.1.0"\n}',
      },
    ],
    ui: { outputLanguage: "json" },
  },
  inputSchema,
  outputSchema,
  execute,
});
