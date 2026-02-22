import { describe, it, expect } from "vitest";
import { rangeToCidr } from "../../../src/tools/network/range-to-cidr";
import { executeTool } from "../../../src/core/executor";

describe("rangeToCidr", () => {
  it("should have correct metadata", () => {
    expect(rangeToCidr.meta.id).toBe("network/range-to-cidr");
    expect(rangeToCidr.meta.category).toBe("network");
  });

  it("should convert a /24 range", async () => {
    const result = await executeTool(rangeToCidr, {
      input: "192.168.1.0 - 192.168.1.255",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.startIp).toBe("192.168.1.0");
      expect(data.endIp).toBe("192.168.1.255");
      expect(data.totalAddresses).toBe(256);
      expect(data.cidrBlocks).toContain("192.168.1.0/24");
    }
  });

  it("should convert a single IP range", async () => {
    const result = await executeTool(rangeToCidr, {
      input: "10.0.0.1 - 10.0.0.1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.totalAddresses).toBe(1);
      expect(data.cidrBlocks).toContain("10.0.0.1/32");
    }
  });

  it("should handle reversed range (auto-swap)", async () => {
    const result = await executeTool(rangeToCidr, {
      input: "192.168.1.255 - 192.168.1.0",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.startIp).toBe("192.168.1.0");
      expect(data.endIp).toBe("192.168.1.255");
    }
  });

  it("should accept newline-separated IPs", async () => {
    const result = await executeTool(rangeToCidr, {
      input: "192.168.1.0\n192.168.1.255",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.totalAddresses).toBe(256);
    }
  });

  it("should handle non-CIDR-aligned ranges", async () => {
    const result = await executeTool(rangeToCidr, {
      input: "192.168.1.1 - 192.168.1.5",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.blockCount).toBeGreaterThan(1);
      expect(data.totalAddresses).toBe(5);
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(rangeToCidr, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid IP", async () => {
    const result = await executeTool(rangeToCidr, {
      input: "not.valid - also.invalid",
    });
    expect(result.success).toBe(false);
  });

  it("should fail on single IP without range", async () => {
    const result = await executeTool(rangeToCidr, { input: "192.168.1.0" });
    expect(result.success).toBe(false);
  });
});
