import { describe, it, expect } from "vitest";
import { webhookCurlGenerator } from "../../../src/tools/api/webhook-curl-generator";
import { executeTool } from "../../../src/core/executor";

describe("webhookCurlGenerator", () => {
  it("should have correct metadata", () => {
    expect(webhookCurlGenerator.meta.id).toBe("api/webhook-curl-generator");
    expect(webhookCurlGenerator.meta.category).toBe("api");
  });

  it("should generate default POST webhook curl", async () => {
    const result = await executeTool(webhookCurlGenerator, {
      method: "POST",
      contentType: "application/json",
      payload: '{"event":"test","data":{"id":1}}',
      headers: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("curl");
      expect(output).toContain("-X POST");
      expect(output).toContain("Content-Type: application/json");
      expect(output).toContain("webhook.site");
    }
  });

  it("should use custom method", async () => {
    const result = await executeTool(webhookCurlGenerator, {
      method: "PUT",
      contentType: "application/json",
      payload: "{}",
      headers: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("-X PUT");
    }
  });

  it("should include custom headers", async () => {
    const result = await executeTool(webhookCurlGenerator, {
      method: "POST",
      contentType: "application/json",
      payload: "{}",
      headers: "X-Webhook-Secret: abc123\nX-Event-Type: test",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("X-Webhook-Secret: abc123");
      expect(output).toContain("X-Event-Type: test");
    }
  });

  it("should format JSON payload in preview", async () => {
    const result = await executeTool(webhookCurlGenerator, {
      method: "POST",
      contentType: "application/json",
      payload: '{"event":"deploy"}',
      headers: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("Payload Preview");
      expect(output).toContain('"event"');
    }
  });

  it("should handle non-JSON payload in preview", async () => {
    const result = await executeTool(webhookCurlGenerator, {
      method: "POST",
      contentType: "text/plain",
      payload: "Hello world",
      headers: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("Hello world");
    }
  });

  it("should handle empty payload", async () => {
    const result = await executeTool(webhookCurlGenerator, {
      method: "GET",
      contentType: "application/json",
      payload: "",
      headers: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("curl");
      expect(output).not.toContain("-d ''");
    }
  });
});
