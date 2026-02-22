import { describe, it, expect } from "vitest";
import { ipExtractor } from "../../../src/tools/text/ip-extractor";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("ipExtractor", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(ipExtractor.meta.id).toBe("text/ip-extractor");
      expect(ipExtractor.meta.name).toBe("IP Address Extractor");
      expect(ipExtractor.meta.category).toBe("text");
      expect(ipExtractor.meta.tier).toBe(ToolTier.CLIENT);
      expect(ipExtractor.meta.keywords).toContain("ip");
      expect(ipExtractor.meta.keywords).toContain("extract");
    });
  });

  describe("execute", () => {
    it("should extract single IPv4 address", async () => {
      const result = await executeTool(ipExtractor, {
        input: "Server IP: 192.168.1.1",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(1);
        expect((result.data as Record<string, unknown>).ipv4).toContain(
          "192.168.1.1"
        );
      }
    });

    it("should extract multiple IPv4 addresses", async () => {
      const result = await executeTool(ipExtractor, {
        input: "From: 10.0.0.1 To: 10.0.0.254",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(2);
        expect((result.data as Record<string, unknown>).ipv4).toContain(
          "10.0.0.1"
        );
        expect((result.data as Record<string, unknown>).ipv4).toContain(
          "10.0.0.254"
        );
      }
    });

    it("should extract IPv6 addresses", async () => {
      const result = await executeTool(ipExtractor, {
        input: "IPv6: 2001:0db8:85a3:0000:0000:8a2e:0370:7334",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          (result.data as Record<string, unknown>).count
        ).toBeGreaterThanOrEqual(1);
        expect(
          ((result.data as Record<string, unknown>).ipv6 as unknown[]).length
        ).toBeGreaterThanOrEqual(1);
      }
    });

    it("should return unique IPs by default", async () => {
      const result = await executeTool(ipExtractor, {
        input: "192.168.1.1 and 192.168.1.1",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(1);
        expect(
          ((result.data as Record<string, unknown>).unique as unknown[]).length
        ).toBe(1);
      }
    });

    it("should return non-unique IPs when option is false", async () => {
      const result = await executeTool(
        ipExtractor,
        { input: "192.168.1.1 and 192.168.1.1" },
        { unique: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(2);
        expect(
          ((result.data as Record<string, unknown>).unique as unknown[]).length
        ).toBe(1);
      }
    });

    it("should exclude IPv6 when option is false", async () => {
      const result = await executeTool(
        ipExtractor,
        { input: "IPv4: 192.168.1.1 IPv6: 2001:0db8::1" },
        { includeIPv6: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          ((result.data as Record<string, unknown>).ipv4 as unknown[]).length
        ).toBe(1);
        expect(
          ((result.data as Record<string, unknown>).ipv6 as unknown[]).length
        ).toBe(0);
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(ipExtractor, { input: "" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(0);
        expect((result.data as Record<string, unknown>).ips).toEqual([]);
      }
    });

    it("should handle input with no IPs", async () => {
      const result = await executeTool(ipExtractor, {
        input: "No IP addresses here",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(0);
      }
    });

    it("should extract localhost", async () => {
      const result = await executeTool(ipExtractor, {
        input: "Server: 127.0.0.1",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).ipv4).toContain(
          "127.0.0.1"
        );
      }
    });

    it("should extract private network IPs", async () => {
      const result = await executeTool(ipExtractor, {
        input: "Internal: 10.0.0.1 172.16.0.1 192.168.0.1",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(3);
      }
    });

    it("should validate IP ranges", async () => {
      const result = await executeTool(ipExtractor, {
        input: "Valid: 192.168.1.1 Invalid: 999.999.999.999",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).ipv4).toContain(
          "192.168.1.1"
        );
        expect((result.data as Record<string, unknown>).ipv4).not.toContain(
          "999.999.999.999"
        );
      }
    });

    it("should handle IPs at boundaries", async () => {
      const result = await executeTool(ipExtractor, {
        input: "0.0.0.0 and 255.255.255.255",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).ipv4).toContain(
          "0.0.0.0"
        );
        expect((result.data as Record<string, unknown>).ipv4).toContain(
          "255.255.255.255"
        );
      }
    });

    it("should handle multiline input", async () => {
      const result = await executeTool(ipExtractor, {
        input: "192.168.1.1\n192.168.1.2\n192.168.1.3",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(3);
      }
    });

    it("should separate IPv4 and IPv6 in output", async () => {
      const result = await executeTool(ipExtractor, {
        input: "IPv4: 192.168.1.1",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          ((result.data as Record<string, unknown>).ipv4 as unknown[]).length
        ).toBe(1);
        expect(
          ((result.data as Record<string, unknown>).ipv6 as unknown[]).length
        ).toBe(0);
      }
    });

    it("should extract IPs from log format", async () => {
      const result = await executeTool(ipExtractor, {
        input:
          "[2023-01-01] 192.168.1.100 - GET /api/users 200 [2023-01-01] 10.0.0.5 - POST /api/login 401",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(2);
        expect((result.data as Record<string, unknown>).ipv4).toContain(
          "192.168.1.100"
        );
        expect((result.data as Record<string, unknown>).ipv4).toContain(
          "10.0.0.5"
        );
      }
    });

    it("should not extract partial IPs", async () => {
      const result = await executeTool(ipExtractor, {
        input: "Not an IP: 192.168.1 or 192.168",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(0);
      }
    });
  });
});
