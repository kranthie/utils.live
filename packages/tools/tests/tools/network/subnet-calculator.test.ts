import { describe, it, expect } from "vitest";
import { subnetCalculator } from "../../../src/tools/network/subnet-calculator";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("subnetCalculator", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(subnetCalculator.meta.id).toBe("network/subnet-calculator");
      expect(subnetCalculator.meta.category).toBe("network");
      expect(subnetCalculator.meta.tier).toBe(ToolTier.CLIENT);
      expect(subnetCalculator.meta.keywords).toContain("subnet");
    });
  });

  describe("execute", () => {
    it("should calculate /24 subnet correctly", async () => {
      const result = await executeTool(subnetCalculator, {
        input: "192.168.1.0/24",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).networkAddress).toBe(
          "192.168.1.0"
        );
        expect((result.data as Record<string, unknown>).broadcastAddress).toBe(
          "192.168.1.255"
        );
        expect((result.data as Record<string, unknown>).subnetMask).toBe(
          "255.255.255.0"
        );
        expect((result.data as Record<string, unknown>).wildcardMask).toBe(
          "0.0.0.255"
        );
        expect((result.data as Record<string, unknown>).cidr).toBe(24);
        expect((result.data as Record<string, unknown>).firstHost).toBe(
          "192.168.1.1"
        );
        expect((result.data as Record<string, unknown>).lastHost).toBe(
          "192.168.1.254"
        );
        expect((result.data as Record<string, unknown>).totalHosts).toBe(256);
        expect((result.data as Record<string, unknown>).usableHosts).toBe(254);
        expect((result.data as Record<string, unknown>).ipClass).toBe("C");
        expect((result.data as Record<string, unknown>).isPrivate).toBe(true);
      }
    });

    it("should calculate /8 subnet correctly", async () => {
      const result = await executeTool(subnetCalculator, {
        input: "10.0.0.0/8",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).networkAddress).toBe(
          "10.0.0.0"
        );
        expect((result.data as Record<string, unknown>).broadcastAddress).toBe(
          "10.255.255.255"
        );
        expect((result.data as Record<string, unknown>).subnetMask).toBe(
          "255.0.0.0"
        );
        expect((result.data as Record<string, unknown>).totalHosts).toBe(
          16777216
        );
        expect((result.data as Record<string, unknown>).usableHosts).toBe(
          16777214
        );
        expect((result.data as Record<string, unknown>).ipClass).toBe("A");
        expect((result.data as Record<string, unknown>).isPrivate).toBe(true);
      }
    });

    it("should handle IP with subnet mask", async () => {
      const result = await executeTool(subnetCalculator, {
        input: "172.16.0.0 255.255.0.0",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).networkAddress).toBe(
          "172.16.0.0"
        );
        expect((result.data as Record<string, unknown>).cidr).toBe(16);
        expect((result.data as Record<string, unknown>).isPrivate).toBe(true);
      }
    });

    it("should handle /32 (single host)", async () => {
      const result = await executeTool(subnetCalculator, {
        input: "8.8.8.8/32",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).totalHosts).toBe(1);
        expect((result.data as Record<string, unknown>).usableHosts).toBe(1);
        expect((result.data as Record<string, unknown>).firstHost).toBe(
          "8.8.8.8"
        );
        expect((result.data as Record<string, unknown>).lastHost).toBe(
          "8.8.8.8"
        );
        expect((result.data as Record<string, unknown>).isPrivate).toBe(false);
      }
    });

    it("should handle /31 (point-to-point link)", async () => {
      const result = await executeTool(subnetCalculator, {
        input: "192.168.1.0/31",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).totalHosts).toBe(2);
        expect((result.data as Record<string, unknown>).usableHosts).toBe(2);
      }
    });

    it("should provide binary representations", async () => {
      const result = await executeTool(subnetCalculator, {
        input: "192.168.1.0/24",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).binaryMask).toBe(
          "11111111.11111111.11111111.00000000"
        );
        expect((result.data as Record<string, unknown>).ipBinary).toBe(
          "11000000.10101000.00000001.00000000"
        );
      }
    });

    it("should fail on invalid CIDR prefix", async () => {
      const result = await executeTool(subnetCalculator, {
        input: "192.168.1.0/33",
      });
      expect(result.success).toBe(false);
    });

    it("should fail on invalid IP address", async () => {
      const result = await executeTool(subnetCalculator, {
        input: "300.168.1.0/24",
      });
      expect(result.success).toBe(false);
    });

    it("should fail on invalid format", async () => {
      const result = await executeTool(subnetCalculator, {
        input: "not an ip",
      });
      expect(result.success).toBe(false);
    });
  });
});
