import { describe, it, expect } from "vitest";
import { awsArnParser } from "../../../src/tools/api/aws-arn-parser";
import { executeTool } from "../../../src/core/executor";

describe("awsArnParser", () => {
  it("should have correct metadata", () => {
    expect(awsArnParser.meta.id).toBe("api/aws-arn-parser");
    expect(awsArnParser.meta.category).toBe("api");
  });

  it("should parse S3 bucket ARN", async () => {
    const result = await executeTool(awsArnParser, {
      input: "arn:aws:s3:::my-bucket",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.partition).toBe("aws");
      expect(data.service).toBe("s3");
      expect(data.resourceId).toBe("my-bucket");
    }
  });

  it("should parse IAM role ARN", async () => {
    const result = await executeTool(awsArnParser, {
      input: "arn:aws:iam::123456789012:role/MyRole",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.service).toBe("iam");
      expect(data.accountId).toBe("123456789012");
      expect(data.resourceType).toBe("role");
      expect(data.resourceId).toBe("MyRole");
    }
  });

  it("should parse Lambda function ARN", async () => {
    const result = await executeTool(awsArnParser, {
      input: "arn:aws:lambda:us-east-1:123456789012:function:my-func",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.service).toBe("lambda");
      expect(data.region).toBe("us-east-1");
      expect(data.resourceType).toBe("function");
      expect(data.resourceId).toBe("my-func");
    }
  });

  it("should handle global services with empty region", async () => {
    const result = await executeTool(awsArnParser, {
      input: "arn:aws:iam::123456789012:user/admin",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.region).toBe("(global)");
    }
  });

  it("should parse GovCloud partition", async () => {
    const result = await executeTool(awsArnParser, {
      input: "arn:aws-us-gov:s3:::gov-bucket",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.partition).toBe("aws-us-gov");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(awsArnParser, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on non-ARN string", async () => {
    const result = await executeTool(awsArnParser, { input: "not-an-arn" });
    expect(result.success).toBe(false);
  });

  it("should fail on too few parts", async () => {
    const result = await executeTool(awsArnParser, { input: "arn:aws:s3" });
    expect(result.success).toBe(false);
  });
});
