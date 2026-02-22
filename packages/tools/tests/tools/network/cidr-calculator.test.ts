import { describe, it, expect } from "vitest";
import { cidrCalculator } from "../../../src/tools/network/cidr-calculator";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("cidrCalculator", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(cidrCalculator.meta.id).toBe("network/cidr-calculator");
      expect(cidrCalculator.meta.category).toBe("network");
      expect(cidrCalculator.meta.tier).toBe(ToolTier.CLIENT);
      expect(cidrCalculator.meta.keywords).toContain("cidr");
    });
  });

  describe("execute", () => {
    it("should calculate /24 CIDR range", async () => {
      const result = await executeTool(cidrCalculator, {
        input: "192.168.1.0/24",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const ranges = (result.data as Record<string, unknown>)
          .ranges as Record<string, unknown>[];
        expect(ranges).toHaveLength(1);
        const range = ranges[0];
        expect(range.cidr).toBe("192.168.1.0/24");
        expect(range.networkAddress).toBe("192.168.1.0");
        expect(range.broadcastAddress).toBe("192.168.1.255");
        expect(range.totalAddresses).toBe(256);
        expect(range.subnetMask).toBe("255.255.255.0");
      }
    });

    it("should calculate /16 CIDR range", async () => {
      const result = await executeTool(cidrCalculator, {
        input: "10.0.0.0/16",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const ranges = (result.data as Record<string, unknown>)
          .ranges as Record<string, unknown>[];
        const range = ranges[0];
        expect(range.totalAddresses).toBe(65536);
        expect(range.firstIp).toBe("10.0.0.0");
        expect(range.lastIp).toBe("10.0.255.255");
      }
    });

    it("should handle multiple CIDRs on separate lines", async () => {
      const result = await executeTool(cidrCalculator, {
        input: "10.0.0.0/24\n172.16.0.0/16",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const ranges = (result.data as Record<string, unknown>)
          .ranges as Record<string, unknown>[];
        expect(ranges).toHaveLength(2);
        expect(ranges[0].cidr).toBe("10.0.0.0/24");
        expect(ranges[1].cidr).toBe("172.16.0.0/16");
      }
    });

    it("should normalize network address from host IP", async () => {
      const result = await executeTool(cidrCalculator, {
        input: "192.168.1.100/24",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const ranges = (result.data as Record<string, unknown>)
          .ranges as Record<string, unknown>[];
        expect(ranges[0].cidr).toBe("192.168.1.0/24");
      }
    });

    it("should handle /32 single host", async () => {
      const result = await executeTool(cidrCalculator, {
        input: "1.2.3.4/32",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const ranges = (result.data as Record<string, unknown>)
          .ranges as Record<string, unknown>[];
        expect(ranges[0].totalAddresses).toBe(1);
        expect(ranges[0].firstIp).toBe("1.2.3.4");
        expect(ranges[0].lastIp).toBe("1.2.3.4");
      }
    });

    it("should fail on invalid CIDR notation", async () => {
      const result = await executeTool(cidrCalculator, {
        input: "192.168.1.0",
      });
      expect(result.success).toBe(false);
    });

    it("should fail on empty input", async () => {
      const result = await executeTool(cidrCalculator, { input: "" });
      expect(result.success).toBe(false);
    });
  });
});
