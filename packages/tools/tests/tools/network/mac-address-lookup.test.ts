import { describe, it, expect } from "vitest";
import { macAddressLookup } from "../../../src/tools/network/mac-address-lookup";
import { executeTool } from "../../../src/core/executor";

describe("macAddressLookup", () => {
  it("should have correct metadata", () => {
    expect(macAddressLookup.meta.id).toBe("network/mac-address-lookup");
    expect(macAddressLookup.meta.category).toBe("network");
  });

  it("should look up Apple vendor (colon format)", async () => {
    const result = await executeTool(macAddressLookup, {
      input: "00:0A:95:11:22:33",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.vendor).toBe("Apple");
      expect(data.mac).toBe("00:0A:95:11:22:33");
      expect(data.oui).toBe("00:0A:95");
    }
  });

  it("should look up VMware vendor (dash format)", async () => {
    const result = await executeTool(macAddressLookup, {
      input: "00-0C-29-AA-BB-CC",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.vendor).toBe("VMware");
    }
  });

  it("should handle bare format (no separators)", async () => {
    const result = await executeTool(macAddressLookup, {
      input: "000C29AABBCC",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.vendor).toBe("VMware");
      expect(data.mac).toBe("00:0C:29:AA:BB:CC");
    }
  });

  it("should provide multiple format representations", async () => {
    const result = await executeTool(macAddressLookup, {
      input: "00:50:56:AA:BB:CC",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.mac).toBe("00:50:56:AA:BB:CC");
      expect(data.macDash).toBe("00-50-56-AA-BB-CC");
      expect(data.macBare).toBe("005056AABBCC");
      expect(data.macDot).toBeDefined(); // Cisco dot format
    }
  });

  it("should identify unicast/multicast flags", async () => {
    // Even first octet = unicast
    const result = await executeTool(macAddressLookup, {
      input: "00:0A:95:11:22:33",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.isUnicast).toBe(true);
      expect(data.isMulticast).toBe(false);
    }
  });

  it("should identify universal/local flags", async () => {
    const result = await executeTool(macAddressLookup, {
      input: "00:0A:95:11:22:33",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.isUniversal).toBe(true);
      expect(data.isLocal).toBe(false);
    }
  });

  it("should provide binary representation", async () => {
    const result = await executeTool(macAddressLookup, {
      input: "00:0A:95:11:22:33",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.binary).toBeDefined();
    }
  });

  it("should return Unknown for unrecognized OUI", async () => {
    const result = await executeTool(macAddressLookup, {
      input: "FF:FE:FD:11:22:33",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.vendor).toBe("Unknown");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(macAddressLookup, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid MAC", async () => {
    const result = await executeTool(macAddressLookup, {
      input: "not-a-mac-address",
    });
    expect(result.success).toBe(false);
  });

  it("should fail on too-short MAC", async () => {
    const result = await executeTool(macAddressLookup, { input: "00:0A:95" });
    expect(result.success).toBe(false);
  });
});
