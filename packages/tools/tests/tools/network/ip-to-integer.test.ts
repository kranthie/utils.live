import { describe, it, expect } from "vitest";
import { ipToInteger } from "../../../src/tools/network/ip-to-integer";
import { executeTool } from "../../../src/core/executor";

describe("ipToInteger", () => {
  it("should have correct metadata", () => {
    expect(ipToInteger.meta.id).toBe("network/ip-to-integer");
    expect(ipToInteger.meta.category).toBe("network");
  });

  it("should convert 192.168.1.1 to integer", async () => {
    const result = await executeTool(ipToInteger, { input: "192.168.1.1" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.ip).toBe("192.168.1.1");
      expect(data.integer).toBe(3232235777);
    }
  });

  it("should convert 0.0.0.0 to 0", async () => {
    const result = await executeTool(ipToInteger, { input: "0.0.0.0" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.integer).toBe(0);
    }
  });

  it("should convert 255.255.255.255 to max", async () => {
    const result = await executeTool(ipToInteger, { input: "255.255.255.255" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.integer).toBe(4294967295);
    }
  });

  it("should provide hex representation", async () => {
    const result = await executeTool(ipToInteger, { input: "192.168.1.1" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.hex).toBe("0xC0A80101");
    }
  });

  it("should provide binary representation", async () => {
    const result = await executeTool(ipToInteger, { input: "192.168.1.1" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.binary).toBe("11000000.10101000.00000001.00000001");
    }
  });

  it("should provide octal representation", async () => {
    const result = await executeTool(ipToInteger, { input: "192.168.1.1" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.octal).toBeDefined();
    }
  });

  it("should include octets array", async () => {
    const result = await executeTool(ipToInteger, { input: "10.20.30.40" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.octets).toEqual([10, 20, 30, 40]);
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(ipToInteger, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid IP format", async () => {
    const result = await executeTool(ipToInteger, { input: "not.an.ip" });
    expect(result.success).toBe(false);
  });

  it("should fail on out-of-range octet", async () => {
    const result = await executeTool(ipToInteger, { input: "256.0.0.1" });
    expect(result.success).toBe(false);
  });

  it("should fail on too few octets", async () => {
    const result = await executeTool(ipToInteger, { input: "192.168.1" });
    expect(result.success).toBe(false);
  });
});
