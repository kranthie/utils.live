import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  operation: z
    .enum([
      "get",
      "set",
      "del",
      "hget",
      "hset",
      "hdel",
      "hgetall",
      "lpush",
      "rpush",
      "lpop",
      "rpop",
      "lrange",
      "sadd",
      "srem",
      "smembers",
      "zadd",
      "zrem",
      "zrange",
      "expire",
      "ttl",
      "keys",
      "exists",
      "incr",
      "decr",
      "mget",
      "mset",
      "publish",
      "subscribe",
    ])
    .default("get")
    .describe("Redis operation"),
  key: z.string().default("mykey").describe("Key name"),
  value: z.string().default("").describe("Value (for SET/HSET etc.)"),
  field: z.string().default("").describe("Hash field name (for HGET/HSET)"),
  start: z.number().default(0).describe("Start index (for LRANGE/ZRANGE)"),
  stop: z.number().default(-1).describe("Stop index (for LRANGE/ZRANGE)"),
  score: z.number().default(0).describe("Score (for ZADD)"),
  ttl: z.number().optional().describe("TTL in seconds (for SET with EX)"),
  pattern: z.string().default("*").describe("Pattern (for KEYS)"),
  format: z
    .enum(["redis-cli", "node-redis", "ioredis", "python"])
    .default("redis-cli")
    .describe("Output format"),
});
const outputSchema = z.object({ output: z.string().describe("Redis command") });

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const {
    operation,
    key,
    value,
    field,
    start,
    stop,
    score,
    ttl,
    pattern,
    format,
  } = input;

  const cmd = buildCommand(
    operation,
    key,
    value,
    field,
    start,
    stop,
    score,
    ttl,
    pattern
  );

  if (format === "redis-cli") return { output: cmd };

  if (format === "node-redis") {
    const nodeCmd = buildNodeRedis(
      operation,
      key,
      value,
      field,
      start,
      stop,
      score,
      ttl,
      pattern
    );
    return { output: nodeCmd };
  }

  if (format === "ioredis") {
    const ioCmd = buildIoRedis(
      operation,
      key,
      value,
      field,
      start,
      stop,
      score,
      ttl,
      pattern
    );
    return { output: ioCmd };
  }

  if (format === "python") {
    const pyCmd = buildPython(
      operation,
      key,
      value,
      field,
      start,
      stop,
      score,
      ttl,
      pattern
    );
    return { output: pyCmd };
  }

  return { output: cmd };
}

function buildCommand(
  op: string,
  key: string,
  value: string,
  field: string,
  start: number,
  stop: number,
  score: number,
  ttl: number | undefined,
  pattern: string
): string {
  switch (op) {
    case "get":
      return `GET ${key}`;
    case "set":
      return ttl ? `SET ${key} "${value}" EX ${ttl}` : `SET ${key} "${value}"`;
    case "del":
      return `DEL ${key}`;
    case "hget":
      return `HGET ${key} ${field}`;
    case "hset":
      return `HSET ${key} ${field} "${value}"`;
    case "hdel":
      return `HDEL ${key} ${field}`;
    case "hgetall":
      return `HGETALL ${key}`;
    case "lpush":
      return `LPUSH ${key} "${value}"`;
    case "rpush":
      return `RPUSH ${key} "${value}"`;
    case "lpop":
      return `LPOP ${key}`;
    case "rpop":
      return `RPOP ${key}`;
    case "lrange":
      return `LRANGE ${key} ${start} ${stop}`;
    case "sadd":
      return `SADD ${key} "${value}"`;
    case "srem":
      return `SREM ${key} "${value}"`;
    case "smembers":
      return `SMEMBERS ${key}`;
    case "zadd":
      return `ZADD ${key} ${score} "${value}"`;
    case "zrem":
      return `ZREM ${key} "${value}"`;
    case "zrange":
      return `ZRANGE ${key} ${start} ${stop} WITHSCORES`;
    case "expire":
      return `EXPIRE ${key} ${ttl ?? 3600}`;
    case "ttl":
      return `TTL ${key}`;
    case "keys":
      return `KEYS ${pattern}`;
    case "exists":
      return `EXISTS ${key}`;
    case "incr":
      return `INCR ${key}`;
    case "decr":
      return `DECR ${key}`;
    case "mget":
      return `MGET ${key}`;
    case "mset":
      return `MSET ${key} "${value}"`;
    case "publish":
      return `PUBLISH ${key} "${value}"`;
    case "subscribe":
      return `SUBSCRIBE ${key}`;
    default:
      return `${op.toUpperCase()} ${key}`;
  }
}

function buildNodeRedis(
  op: string,
  key: string,
  value: string,
  field: string,
  start: number,
  stop: number,
  score: number,
  ttl: number | undefined,
  _pattern: string
): string {
  const esc = (s: string): string => `'${s}'`;
  switch (op) {
    case "get":
      return `await client.get(${esc(key)});`;
    case "set":
      return ttl
        ? `await client.set(${esc(key)}, ${esc(value)}, { EX: ${ttl} });`
        : `await client.set(${esc(key)}, ${esc(value)});`;
    case "del":
      return `await client.del(${esc(key)});`;
    case "hget":
      return `await client.hGet(${esc(key)}, ${esc(field)});`;
    case "hset":
      return `await client.hSet(${esc(key)}, ${esc(field)}, ${esc(value)});`;
    case "hgetall":
      return `await client.hGetAll(${esc(key)});`;
    case "lpush":
      return `await client.lPush(${esc(key)}, ${esc(value)});`;
    case "rpush":
      return `await client.rPush(${esc(key)}, ${esc(value)});`;
    case "lrange":
      return `await client.lRange(${esc(key)}, ${start}, ${stop});`;
    case "sadd":
      return `await client.sAdd(${esc(key)}, ${esc(value)});`;
    case "smembers":
      return `await client.sMembers(${esc(key)});`;
    case "zadd":
      return `await client.zAdd(${esc(key)}, { score: ${score}, value: ${esc(value)} });`;
    case "zrange":
      return `await client.zRangeWithScores(${esc(key)}, ${start}, ${stop});`;
    default:
      return `await client.${op}(${esc(key)});`;
  }
}

function buildIoRedis(
  op: string,
  key: string,
  value: string,
  field: string,
  start: number,
  stop: number,
  score: number,
  ttl: number | undefined,
  _pattern: string
): string {
  const esc = (s: string): string => `'${s}'`;
  switch (op) {
    case "get":
      return `await redis.get(${esc(key)});`;
    case "set":
      return ttl
        ? `await redis.set(${esc(key)}, ${esc(value)}, 'EX', ${ttl});`
        : `await redis.set(${esc(key)}, ${esc(value)});`;
    case "del":
      return `await redis.del(${esc(key)});`;
    case "hget":
      return `await redis.hget(${esc(key)}, ${esc(field)});`;
    case "hset":
      return `await redis.hset(${esc(key)}, ${esc(field)}, ${esc(value)});`;
    case "hgetall":
      return `await redis.hgetall(${esc(key)});`;
    case "lpush":
      return `await redis.lpush(${esc(key)}, ${esc(value)});`;
    case "lrange":
      return `await redis.lrange(${esc(key)}, ${start}, ${stop});`;
    case "sadd":
      return `await redis.sadd(${esc(key)}, ${esc(value)});`;
    case "zadd":
      return `await redis.zadd(${esc(key)}, ${score}, ${esc(value)});`;
    case "zrange":
      return `await redis.zrange(${esc(key)}, ${start}, ${stop}, 'WITHSCORES');`;
    default:
      return `await redis.${op}(${esc(key)});`;
  }
}

function buildPython(
  op: string,
  key: string,
  value: string,
  field: string,
  start: number,
  stop: number,
  score: number,
  ttl: number | undefined,
  _pattern: string
): string {
  const esc = (s: string): string => `"${s}"`;
  switch (op) {
    case "get":
      return `r.get(${esc(key)})`;
    case "set":
      return ttl
        ? `r.set(${esc(key)}, ${esc(value)}, ex=${ttl})`
        : `r.set(${esc(key)}, ${esc(value)})`;
    case "del":
      return `r.delete(${esc(key)})`;
    case "hget":
      return `r.hget(${esc(key)}, ${esc(field)})`;
    case "hset":
      return `r.hset(${esc(key)}, ${esc(field)}, ${esc(value)})`;
    case "hgetall":
      return `r.hgetall(${esc(key)})`;
    case "lpush":
      return `r.lpush(${esc(key)}, ${esc(value)})`;
    case "lrange":
      return `r.lrange(${esc(key)}, ${start}, ${stop})`;
    case "sadd":
      return `r.sadd(${esc(key)}, ${esc(value)})`;
    case "zadd":
      return `r.zadd(${esc(key)}, {${esc(value)}: ${score}})`;
    case "zrange":
      return `r.zrange(${esc(key)}, ${start}, ${stop}, withscores=True)`;
    default:
      return `r.${op}(${esc(key)})`;
  }
}

// FIXME(category-mismatch): Tool belongs in 'database' category, not 'sql'. Tracked in DC-006.
export const redisCommandBuilder = defineTool({
  meta: {
    id: "sql/redis-command-builder",
    name: "Redis Command Builder",
    description:
      "Free online Redis command builder — generate GET, SET, HSET, LPUSH, SADD, ZADD, and other Redis commands in CLI, Node.js, or Python format instantly in your browser. No data is stored.",
    category: "sql",
    subgroup: "Database Tools",
    tier: ToolTier.CLIENT,
    keywords: ["redis", "command", "builder", "cache", "database", "nosql"],
    examples: [
      {
        title: "Cache Session Data",
        description: "Build a Redis SET command with TTL for session caching",
        input: {
          operation: "set",
          key: "session:user123",
          value: '{"userId": 123, "role": "admin"}',
          ttl: 3600,
        },
        output:
          'SET session:user123 "{"userId": 123, "role": "admin"}" EX 3600',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
