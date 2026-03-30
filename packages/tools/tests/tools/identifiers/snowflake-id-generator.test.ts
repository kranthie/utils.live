import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { snowflakeIdGenerator } from "../../../src/tools/identifiers/snowflake-id-generator";

describe("Snowflake ID Generator", () => {
  it("should generate a numeric Snowflake ID", async () => {
    const result = await executeTool(snowflakeIdGenerator, { count: 1 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(/^\d+$/);
      expect(
        BigInt((result.data as Record<string, unknown>).output)
      ).toBeGreaterThan(0n);
    }
  });

  it("should generate multiple unique IDs", async () => {
    const result = await executeTool(snowflakeIdGenerator, { count: 5 });
    expect(result.success).toBe(true);
    if (result.success) {
      const ids = String((result.data as Record<string, unknown>).output).split(
        "\n"
      );
      expect(ids).toHaveLength(5);
      const unique = new Set(ids);
      expect(unique.size).toBe(5);
    }
  });

  it("should generate increasing IDs", async () => {
    const result = await executeTool(snowflakeIdGenerator, { count: 3 });
    expect(result.success).toBe(true);
    if (result.success) {
      const ids = String((result.data as Record<string, unknown>).output)
        .split("\n")
        .map(BigInt);
      expect(ids[0]! < ids[1]!).toBe(true);
      expect(ids[1]! < ids[2]!).toBe(true);
    }
  });

  it("should encode workerId and datacenterId correctly in the generated ID", async () => {
    // Snowflake layout (bits): [41 timestamp][5 datacenter][5 worker][12 sequence]
    const workerId = 7;
    const datacenterId = 13;
    const result = await executeTool(snowflakeIdGenerator, {
      count: 1,
      workerId,
      datacenterId,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      const id = BigInt(
        String((result.data as Record<string, unknown>).output)
      );
      // Extract worker bits (bits 12-16)
      const decodedWorker = Number((id >> 12n) & 0x1fn);
      // Extract datacenter bits (bits 17-21)
      const decodedDatacenter = Number((id >> 17n) & 0x1fn);
      expect(decodedWorker).toBe(workerId);
      expect(decodedDatacenter).toBe(datacenterId);
    }
  });

  it("should encode different workerIds correctly", async () => {
    for (const workerId of [0, 1, 15, 31]) {
      const result = await executeTool(snowflakeIdGenerator, {
        count: 1,
        workerId,
        datacenterId: 0,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const id = BigInt(
          String((result.data as Record<string, unknown>).output)
        );
        const decodedWorker = Number((id >> 12n) & 0x1fn);
        expect(decodedWorker).toBe(workerId);
      }
    }
  });
});
