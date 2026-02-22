import { describe, it, expect } from "vitest";
import { integerToIp } from "../../../src/tools/network/integer-to-ip";
import { executeTool } from "../../../src/core/executor";

describe("integerToIp", () => {
  it("should have correct metadata", () => {
    expect(integerToIp.meta.id).toBe("network/integer-to-ip");
    expect(integerToIp.meta.category).toBe("network");
  });

  it("should convert decimal to IPv4", async () => {
    const result = await executeTool(integerToIp, { input: "3232235777" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.ip).toBe("192.168.1.1");
      expect(data.integer).toBe(3232235777);
    }
  });

  it("should convert hex to IPv4", async () => {
    const result = await executeTool(integerToIp, { input: "0xC0A80101" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.ip).toBe("192.168.1.1");
    }
  });

  it("should convert octal to IPv4", async () => {
    const result = await executeTool(integerToIp, { input: "030052000401" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.ip).toBeDefined();
    }
  });

  it("should handle zero", async () => {
    const result = await executeTool(integerToIp, { input: "0" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.ip).toBe("0.0.0.0");
    }
  });

  it("should handle max value", async () => {
    const result = await executeTool(integerToIp, { input: "4294967295" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.ip).toBe("255.255.255.255");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(integerToIp, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on out-of-range value", async () => {
    const result = await executeTool(integerToIp, { input: "4294967296" });
    expect(result.success).toBe(false);
  });

  it("should include binary representation", async () => {
    const result = await executeTool(integerToIp, { input: "16909060" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.binary).toBeDefined();
      expect(data.hex).toBeDefined();
    }
  });
});
