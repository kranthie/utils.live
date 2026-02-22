import { describe, it, expect } from "vitest";
import { ipv6Compressor } from "../../../src/tools/network/ipv6-compressor";
import { executeTool } from "../../../src/core/executor";

describe("ipv6Compressor", () => {
  it("should have correct metadata", () => {
    expect(ipv6Compressor.meta.id).toBe("network/ipv6-compressor");
    expect(ipv6Compressor.meta.category).toBe("network");
  });

  it("should compress a full IPv6 with consecutive zeros", async () => {
    const result = await executeTool(ipv6Compressor, {
      input: "2001:0db8:0000:0000:0000:0000:0000:0001",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.compressed).toBe("2001:db8::1");
    }
  });

  it("should compress all-zeros to ::", async () => {
    const result = await executeTool(ipv6Compressor, {
      input: "0000:0000:0000:0000:0000:0000:0000:0000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.compressed).toBe("::");
    }
  });

  it("should handle loopback (already compressed input with ::)", async () => {
    const result = await executeTool(ipv6Compressor, { input: "::1" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.compressed).toBe("::1");
    }
  });

  it("should remove leading zeros from groups", async () => {
    const result = await executeTool(ipv6Compressor, {
      input: "2001:0db8:0085:0000:0000:8a2e:0370:7334",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.compressed).toBe("2001:db8:85::8a2e:370:7334");
    }
  });

  it("should handle no consecutive zeros", async () => {
    const result = await executeTool(ipv6Compressor, {
      input: "2001:0db8:0001:0002:0003:0004:0005:0006",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.compressed).toBe("2001:db8:1:2:3:4:5:6");
    }
  });

  it("should handle multiple addresses", async () => {
    const result = await executeTool(ipv6Compressor, {
      input:
        "2001:0db8:0000:0000:0000:0000:0000:0001\nfe80:0000:0000:0000:0000:0000:0000:0001",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>[];
      expect(data).toHaveLength(2);
      expect(data[0].compressed).toBe("2001:db8::1");
      expect(data[1].compressed).toBe("fe80::1");
    }
  });

  it("should provide expanded form", async () => {
    const result = await executeTool(ipv6Compressor, {
      input: "2001:db8::1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.expanded).toBe("2001:0db8:0000:0000:0000:0000:0000:0001");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(ipv6Compressor, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid IPv6", async () => {
    const result = await executeTool(ipv6Compressor, { input: "not:an:ipv6" });
    expect(result.success).toBe(false);
  });
});
