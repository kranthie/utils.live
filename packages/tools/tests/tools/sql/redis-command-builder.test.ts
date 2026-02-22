import { describe, it, expect } from "vitest";
import { redisCommandBuilder } from "../../../src/tools/sql/redis-command-builder";
import { executeTool } from "../../../src/core/executor";

describe("redisCommandBuilder", () => {
  it("should have correct metadata", () => {
    expect(redisCommandBuilder.meta.id).toBe("sql/redis-command-builder");
    expect(redisCommandBuilder.meta.category).toBe("sql");
  });

  it("should build GET command", async () => {
    const result = await executeTool(redisCommandBuilder, {
      operation: "get",
      key: "user:1",
      value: "",
      field: "",
      start: 0,
      stop: -1,
      score: 0,
      pattern: "*",
      format: "redis-cli",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toBe("GET user:1");
    }
  });

  it("should build SET command with TTL", async () => {
    const result = await executeTool(redisCommandBuilder, {
      operation: "set",
      key: "session:abc",
      value: "data",
      field: "",
      start: 0,
      stop: -1,
      score: 0,
      ttl: 3600,
      pattern: "*",
      format: "redis-cli",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("SET session:abc");
      expect(output).toContain("EX 3600");
    }
  });

  it("should build HSET command", async () => {
    const result = await executeTool(redisCommandBuilder, {
      operation: "hset",
      key: "user:1",
      value: "Alice",
      field: "name",
      start: 0,
      stop: -1,
      score: 0,
      pattern: "*",
      format: "redis-cli",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toBe('HSET user:1 name "Alice"');
    }
  });

  it("should build ZADD command", async () => {
    const result = await executeTool(redisCommandBuilder, {
      operation: "zadd",
      key: "leaderboard",
      value: "player1",
      field: "",
      start: 0,
      stop: -1,
      score: 100,
      pattern: "*",
      format: "redis-cli",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("ZADD leaderboard 100");
    }
  });

  it("should build LRANGE command", async () => {
    const result = await executeTool(redisCommandBuilder, {
      operation: "lrange",
      key: "mylist",
      value: "",
      field: "",
      start: 0,
      stop: 9,
      score: 0,
      pattern: "*",
      format: "redis-cli",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toBe("LRANGE mylist 0 9");
    }
  });

  it("should output node-redis format", async () => {
    const result = await executeTool(redisCommandBuilder, {
      operation: "get",
      key: "user:1",
      value: "",
      field: "",
      start: 0,
      stop: -1,
      score: 0,
      pattern: "*",
      format: "node-redis",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("await client.get");
    }
  });

  it("should output ioredis format", async () => {
    const result = await executeTool(redisCommandBuilder, {
      operation: "set",
      key: "mykey",
      value: "myval",
      field: "",
      start: 0,
      stop: -1,
      score: 0,
      ttl: 60,
      pattern: "*",
      format: "ioredis",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("await redis.set");
      expect(output).toContain("EX");
    }
  });

  it("should output python format", async () => {
    const result = await executeTool(redisCommandBuilder, {
      operation: "get",
      key: "user:1",
      value: "",
      field: "",
      start: 0,
      stop: -1,
      score: 0,
      pattern: "*",
      format: "python",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain('r.get("user:1")');
    }
  });
});
