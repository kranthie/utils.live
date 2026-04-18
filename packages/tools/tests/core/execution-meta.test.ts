import { describe, it, expect } from "vitest";
import {
  createExecutionMeta,
  getByteSize,
} from "../../src/core/execution-meta";
import { ToolTier } from "../../src/types";

describe("createExecutionMeta", () => {
  it("should create execution meta for CLIENT tier with 0 credits", () => {
    const meta = createExecutionMeta({
      startTime: 0,
      endTime: 50,
      inputSizeBytes: 100,
      outputSizeBytes: 200,
      tier: ToolTier.CLIENT,
    });

    expect(meta.executionTimeMs).toBe(50);
    expect(meta.inputSizeBytes).toBe(100);
    expect(meta.outputSizeBytes).toBe(200);
    expect(meta.creditsUsed).toBe(0);
    expect(meta.tier).toBe(ToolTier.CLIENT);
    expect(meta.timestamp).toBeDefined();
  });

  it("should always return 0 credits for CLIENT tier even with baseCredits set", () => {
    const meta = createExecutionMeta({
      startTime: 0,
      endTime: 100,
      inputSizeBytes: 50,
      outputSizeBytes: 150,
      tier: ToolTier.CLIENT,
      baseCredits: 5,
    });

    expect(meta.creditsUsed).toBe(0);
    expect(meta.tier).toBe(ToolTier.CLIENT);
  });

  it("should round execution time to 2 decimal places", () => {
    const meta = createExecutionMeta({
      startTime: 0,
      endTime: 33.33333,
      inputSizeBytes: 10,
      outputSizeBytes: 20,
      tier: ToolTier.CLIENT,
    });

    expect(meta.executionTimeMs).toBe(33.33);
  });

  it("should generate valid ISO timestamp", () => {
    const meta = createExecutionMeta({
      startTime: 0,
      endTime: 10,
      inputSizeBytes: 10,
      outputSizeBytes: 10,
      tier: ToolTier.CLIENT,
    });

    // Should be a valid ISO string
    expect(() => new Date(meta.timestamp)).not.toThrow();
    expect(meta.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

describe("getByteSize", () => {
  it("should return 0 for null", () => {
    expect(getByteSize(null)).toBe(0);
  });

  it("should return 0 for undefined", () => {
    expect(getByteSize(undefined)).toBe(0);
  });

  it("should return correct size for ASCII string", () => {
    expect(getByteSize("hello")).toBe(5);
  });

  it("should return correct size for UTF-8 string with multi-byte characters", () => {
    // Chinese characters are 3 bytes each in UTF-8
    expect(getByteSize("世界")).toBe(6);
  });

  it("should return correct size for emoji", () => {
    // Most emojis are 4 bytes in UTF-8
    expect(getByteSize("🌍")).toBe(4);
  });

  it("should return correct size for object", () => {
    const obj = { name: "test" };
    const expectedSize = new TextEncoder().encode(JSON.stringify(obj)).length;
    expect(getByteSize(obj)).toBe(expectedSize);
  });

  it("should return correct size for array", () => {
    const arr = [1, 2, 3];
    const expectedSize = new TextEncoder().encode(JSON.stringify(arr)).length;
    expect(getByteSize(arr)).toBe(expectedSize);
  });

  it("should return correct size for number", () => {
    const num = 12345;
    const expectedSize = new TextEncoder().encode(JSON.stringify(num)).length;
    expect(getByteSize(num)).toBe(expectedSize);
  });

  it("should return Infinity for circular reference objects", () => {
    // Circular refs can't be JSON.stringify'd. Returning Infinity makes the
    // executor's 5 MB input-size guard reject the input rather than silently
    // admit it (which would then blow up inside Zod/the tool).
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(getByteSize(circular)).toBe(Number.POSITIVE_INFINITY);
  });

  it("should return correct size for empty string", () => {
    expect(getByteSize("")).toBe(0);
  });

  it("should return correct size for boolean", () => {
    expect(getByteSize(true)).toBe(4); // "true" is 4 bytes
    expect(getByteSize(false)).toBe(5); // "false" is 5 bytes
  });
});
