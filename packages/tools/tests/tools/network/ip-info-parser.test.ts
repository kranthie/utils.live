import { describe, it, expect } from "vitest";
import { ipInfoParser } from "../../../src/tools/network/ip-info-parser";
import { executeTool } from "../../../src/core/executor";

describe("ipInfoParser", () => {
  it("should have correct metadata", () => {
    expect(ipInfoParser.meta.id).toBe("network/ip-info-parser");
    expect(ipInfoParser.meta.category).toBe("network");
  });

  it("should analyze a public IPv4", async () => {
    const result = await executeTool(ipInfoParser, { input: "8.8.8.8" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.version).toBe("IPv4");
      expect(data.type).toBe("Public");
      expect(data.isPrivate).toBe(false);
      expect(data.class).toBe("A");
    }
  });

  it("should identify private Class A", async () => {
    const result = await executeTool(ipInfoParser, { input: "10.0.0.1" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.isPrivate).toBe(true);
      expect(data.type).toContain("Private");
    }
  });

  it("should identify private Class B", async () => {
    const result = await executeTool(ipInfoParser, { input: "172.16.0.1" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.isPrivate).toBe(true);
    }
  });

  it("should identify private Class C", async () => {
    const result = await executeTool(ipInfoParser, { input: "192.168.1.1" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.isPrivate).toBe(true);
      expect(data.class).toBe("C");
    }
  });

  it("should identify loopback", async () => {
    const result = await executeTool(ipInfoParser, { input: "127.0.0.1" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.isLoopback).toBe(true);
      expect(data.type).toBe("Loopback");
    }
  });

  it("should identify link-local", async () => {
    const result = await executeTool(ipInfoParser, { input: "169.254.1.1" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.isLinkLocal).toBe(true);
    }
  });

  it("should analyze IPv6 loopback", async () => {
    const result = await executeTool(ipInfoParser, { input: "::1" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.version).toBe("IPv6");
      expect(data.isLoopback).toBe(true);
    }
  });

  it("should analyze IPv6 link-local", async () => {
    const result = await executeTool(ipInfoParser, {
      input: "fe80:0000:0000:0000:0000:0000:0000:0001",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.isLinkLocal).toBe(true);
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(ipInfoParser, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid IP", async () => {
    const result = await executeTool(ipInfoParser, { input: "not.an.ip" });
    expect(result.success).toBe(false);
  });
});
