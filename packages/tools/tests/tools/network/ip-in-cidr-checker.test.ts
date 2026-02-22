import { describe, it, expect } from "vitest";
import { ipInCidrChecker } from "../../../src/tools/network/ip-in-cidr-checker";
import { executeTool } from "../../../src/core/executor";

describe("ipInCidrChecker", () => {
  it("should have correct metadata", () => {
    expect(ipInCidrChecker.meta.id).toBe("network/ip-in-cidr-checker");
    expect(ipInCidrChecker.meta.category).toBe("network");
  });

  it("should detect IP in range", async () => {
    const result = await executeTool(ipInCidrChecker, {
      input1: "192.168.1.100",
      input2: "192.168.1.0/24",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.isInRange).toBe(true);
    }
  });

  it("should detect IP out of range", async () => {
    const result = await executeTool(ipInCidrChecker, {
      input1: "10.0.0.1",
      input2: "192.168.1.0/24",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.isInRange).toBe(false);
    }
  });

  it("should handle multiple CIDRs", async () => {
    const result = await executeTool(ipInCidrChecker, {
      input1: "192.168.1.50",
      input2: "192.168.1.0/24\n10.0.0.0/8",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>[];
      expect(data).toHaveLength(2);
      expect(data[0].isInRange).toBe(true);
      expect(data[1].isInRange).toBe(false);
    }
  });

  it("should handle /32 exact match", async () => {
    const result = await executeTool(ipInCidrChecker, {
      input1: "10.0.0.1",
      input2: "10.0.0.1/32",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.isInRange).toBe(true);
    }
  });

  it("should fail on empty IP", async () => {
    const result = await executeTool(ipInCidrChecker, {
      input1: "",
      input2: "192.168.1.0/24",
    });
    expect(result.success).toBe(false);
  });

  it("should fail on empty CIDR", async () => {
    const result = await executeTool(ipInCidrChecker, {
      input1: "192.168.1.1",
      input2: "",
    });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid CIDR", async () => {
    const result = await executeTool(ipInCidrChecker, {
      input1: "192.168.1.1",
      input2: "invalid",
    });
    expect(result.success).toBe(false);
  });
});
