import { describe, it, expect } from "vitest";
import { cidrToRange } from "../../../src/tools/network/cidr-to-range";
import { executeTool } from "../../../src/core/executor";

describe("cidrToRange", () => {
  it("should have correct metadata", () => {
    expect(cidrToRange.meta.id).toBe("network/cidr-to-range");
    expect(cidrToRange.meta.category).toBe("network");
  });

  it("should convert /24 CIDR to range", async () => {
    const result = await executeTool(cidrToRange, { input: "192.168.1.0/24" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.cidr).toBe("192.168.1.0/24");
      expect(data.firstIp).toBe("192.168.1.0");
      expect(data.lastIp).toBe("192.168.1.255");
      expect(data.totalAddresses).toBe(256);
      expect(data.usableHosts).toBe(254);
      expect(data.subnetMask).toBe("255.255.255.0");
    }
  });

  it("should handle /32 single host", async () => {
    const result = await executeTool(cidrToRange, { input: "10.0.0.1/32" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.totalAddresses).toBe(1);
      expect(data.firstIp).toBe("10.0.0.1");
      expect(data.lastIp).toBe("10.0.0.1");
    }
  });

  it("should handle /0 entire address space", async () => {
    const result = await executeTool(cidrToRange, { input: "0.0.0.0/0" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.totalAddresses).toBe(4294967296);
    }
  });

  it("should handle multiple CIDRs", async () => {
    const result = await executeTool(cidrToRange, {
      input: "10.0.0.0/24\n172.16.0.0/16",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>[];
      expect(data).toHaveLength(2);
      expect(data[0].cidr).toBe("10.0.0.0/24");
      expect(data[1].cidr).toBe("172.16.0.0/16");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(cidrToRange, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid CIDR", async () => {
    const result = await executeTool(cidrToRange, { input: "192.168.1.0" });
    expect(result.success).toBe(false);
  });

  it("should normalize network address from host IP", async () => {
    const result = await executeTool(cidrToRange, {
      input: "192.168.1.100/24",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.cidr).toBe("192.168.1.0/24");
    }
  });
});
