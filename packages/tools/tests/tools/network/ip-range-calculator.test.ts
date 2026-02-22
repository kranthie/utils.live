import { describe, it, expect } from "vitest";
import { ipRangeCalculator } from "../../../src/tools/network/ip-range-calculator";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("ipRangeCalculator", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(ipRangeCalculator.meta.id).toBe("network/ip-range-calculator");
      expect(ipRangeCalculator.meta.category).toBe("network");
      expect(ipRangeCalculator.meta.tier).toBe(ToolTier.CLIENT);
      expect(ipRangeCalculator.meta.keywords).toContain("range");
    });
  });

  describe("execute", () => {
    it("should calculate range from CIDR /24", async () => {
      const result = await executeTool(ipRangeCalculator, {
        input: "192.168.1.0/24",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).startIp).toBe(
          "192.168.1.0"
        );
        expect((result.data as Record<string, unknown>).endIp).toBe(
          "192.168.1.255"
        );
        expect((result.data as Record<string, unknown>).totalAddresses).toBe(
          256
        );
        expect((result.data as Record<string, unknown>).isSubnet).toBe(true);
        expect((result.data as Record<string, unknown>).cidrs).toHaveLength(1);
        expect((result.data as Record<string, unknown>).cidrs[0]).toBe(
          "192.168.1.0/24"
        );
      }
    });

    it("should calculate range from dash notation", async () => {
      const result = await executeTool(ipRangeCalculator, {
        input: "10.0.0.1 - 10.0.0.10",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).startIp).toBe(
          "10.0.0.1"
        );
        expect((result.data as Record<string, unknown>).endIp).toBe(
          "10.0.0.10"
        );
        expect((result.data as Record<string, unknown>).totalAddresses).toBe(
          10
        );
      }
    });

    it("should calculate range from two IPs on separate lines", async () => {
      const result = await executeTool(ipRangeCalculator, {
        input: "10.0.0.1\n10.0.0.100",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).startIp).toBe(
          "10.0.0.1"
        );
        expect((result.data as Record<string, unknown>).endIp).toBe(
          "10.0.0.100"
        );
        expect((result.data as Record<string, unknown>).totalAddresses).toBe(
          100
        );
      }
    });

    it("should swap reversed IP order", async () => {
      const result = await executeTool(ipRangeCalculator, {
        input: "10.0.0.100-10.0.0.1",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).startIp).toBe(
          "10.0.0.1"
        );
        expect((result.data as Record<string, unknown>).endIp).toBe(
          "10.0.0.100"
        );
      }
    });

    it("should identify non-subnet ranges", async () => {
      const result = await executeTool(ipRangeCalculator, {
        input: "10.0.0.1-10.0.0.5",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).isSubnet).toBe(false);
        expect(
          (result.data as Record<string, unknown>).cidrs.length
        ).toBeGreaterThan(1);
      }
    });

    it("should fail on invalid IP", async () => {
      const result = await executeTool(ipRangeCalculator, {
        input: "invalid-10.0.0.1",
      });
      expect(result.success).toBe(false);
    });

    it("should fail on invalid format", async () => {
      const result = await executeTool(ipRangeCalculator, {
        input: "hello world",
      });
      expect(result.success).toBe(false);
    });
  });
});
