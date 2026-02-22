import { describe, it, expect } from "vitest";
import { ipv6Expander } from "../../../src/tools/network/ipv6-expander";
import { executeTool } from "../../../src/core/executor";

describe("ipv6Expander", () => {
  it("should have correct metadata", () => {
    expect(ipv6Expander.meta.id).toBe("network/ipv6-expander");
    expect(ipv6Expander.meta.category).toBe("network");
  });

  it("should expand compressed loopback", async () => {
    const result = await executeTool(ipv6Expander, { input: "::1" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.expanded).toBe("0000:0000:0000:0000:0000:0000:0000:0001");
    }
  });

  it("should expand :: to all zeros", async () => {
    const result = await executeTool(ipv6Expander, { input: "::" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.expanded).toBe("0000:0000:0000:0000:0000:0000:0000:0000");
    }
  });

  it("should expand 2001:db8::1", async () => {
    const result = await executeTool(ipv6Expander, { input: "2001:db8::1" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.expanded).toBe("2001:0db8:0000:0000:0000:0000:0000:0001");
    }
  });

  it("should handle already expanded address", async () => {
    const full = "2001:0db8:0000:0000:0000:0000:0000:0001";
    const result = await executeTool(ipv6Expander, { input: full });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.expanded).toBe(full);
    }
  });

  it("should include groups array", async () => {
    const result = await executeTool(ipv6Expander, { input: "::1" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.groups).toHaveLength(8);
    }
  });

  it("should include binary representation", async () => {
    const result = await executeTool(ipv6Expander, { input: "::1" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.binary).toBeDefined();
      expect(data.totalBits).toBe(128);
    }
  });

  it("should handle multiple addresses", async () => {
    const result = await executeTool(ipv6Expander, {
      input: "::1\n2001:db8::1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>[];
      expect(data).toHaveLength(2);
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(ipv6Expander, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid IPv6", async () => {
    const result = await executeTool(ipv6Expander, {
      input: "this-is-not-ipv6",
    });
    expect(result.success).toBe(false);
  });
});
