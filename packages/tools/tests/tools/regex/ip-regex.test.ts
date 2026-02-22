import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { ipRegex } from "../../../src/tools/regex/ip-regex";

describe("IP Regex", () => {
  it("should return IPv4 pattern", async () => {
    const result = await executeTool(ipRegex, { type: "ipv4" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).pattern).toBeDefined();
    }
  });

  it("should return IPv6 pattern", async () => {
    const result = await executeTool(ipRegex, { type: "ipv6" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).pattern).toBeDefined();
    }
  });

  it("should return CIDR pattern", async () => {
    const result = await executeTool(ipRegex, { type: "ipv4-cidr" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).pattern).toBeDefined();
    }
  });
});
