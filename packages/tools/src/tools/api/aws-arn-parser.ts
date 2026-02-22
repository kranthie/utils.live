import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("AWS ARN string to parse"),
});
const outputSchema = z.object({
  output: z.string().describe("Parsed ARN components"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");
  if (!text.startsWith("arn:"))
    throw new Error("Input must be a valid ARN starting with 'arn:'");

  const parts = text.split(":");
  if (parts.length < 6)
    throw new Error(
      "Invalid ARN format. Expected: arn:partition:service:region:account-id:resource"
    );

  const result = {
    arn: text,
    partition: parts[1] || "",
    service: parts[2] || "",
    region: parts[3] || "(global)",
    accountId: parts[4] || "",
    resource: parts.slice(5).join(":"),
    resourceType: "",
    resourceId: "",
  };

  // Parse resource part
  const resource = result.resource;
  if (resource.includes("/")) {
    const slashIdx = resource.indexOf("/");
    result.resourceType = resource.substring(0, slashIdx);
    result.resourceId = resource.substring(slashIdx + 1);
  } else if (resource.includes(":")) {
    const colonIdx = resource.indexOf(":");
    result.resourceType = resource.substring(0, colonIdx);
    result.resourceId = resource.substring(colonIdx + 1);
  } else {
    result.resourceId = resource;
  }

  return { output: JSON.stringify(result, null, 2) };
}

export const awsArnParser = defineTool({
  meta: {
    id: "api/aws-arn-parser",
    name: "AWS ARN Parser",
    description:
      "Free online AWS ARN parser — break down Amazon Resource Names into partition, service, region, account, and resource components instantly in your browser. No data is stored. Parses IAM, S3, Lambda, EC2, and all AWS service ARNs.",
    category: "api",
    subgroup: "Cloud Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "aws",
      "arn",
      "parse",
      "amazon",
      "cloud",
      "resource",
      "iam",
      "s3",
      "lambda",
    ],
    ui: { outputLanguage: "json" },
    examples: [
      {
        title: "Parse IAM User ARN",
        description: "Extract components from an AWS IAM user ARN",
        input: "arn:aws:iam::123456789012:user/johndoe",
        output:
          '{\n  "arn": "arn:aws:iam::123456789012:user/johndoe",\n  "partition": "aws",\n  "service": "iam",\n  "region": "(global)",\n  "accountId": "123456789012",\n  "resource": "user/johndoe",\n  "resourceType": "user",\n  "resourceId": "johndoe"\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
