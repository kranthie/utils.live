import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  count: z
    .number()
    .min(1)
    .max(100)
    .default(1)
    .describe("Number of Snowflake IDs"),
  workerId: z.number().min(0).max(31).default(1).describe("Worker ID (0-31)"),
  datacenterId: z
    .number()
    .min(0)
    .max(31)
    .default(1)
    .describe("Datacenter ID (0-31)"),
  epoch: z
    .number()
    .default(1288834974657)
    .describe("Custom epoch in ms (default: Twitter epoch)"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated Snowflake ID(s)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

let lastTimestamp = -1n;
let sequence = 0n;

function generateSnowflake(
  workerId: number,
  datacenterId: number,
  epoch: number
): string {
  const WORKER_BITS = 5n;
  const DATACENTER_BITS = 5n;
  const SEQUENCE_BITS = 12n;

  const WORKER_SHIFT = SEQUENCE_BITS;
  const DATACENTER_SHIFT = SEQUENCE_BITS + WORKER_BITS;
  const TIMESTAMP_SHIFT = SEQUENCE_BITS + WORKER_BITS + DATACENTER_BITS;
  const SEQUENCE_MASK = (1n << SEQUENCE_BITS) - 1n;

  let timestamp = BigInt(Date.now() - epoch);

  if (timestamp === lastTimestamp) {
    sequence = (sequence + 1n) & SEQUENCE_MASK;
    if (sequence === 0n) {
      // Wait for next millisecond
      while (BigInt(Date.now() - epoch) <= lastTimestamp) {
        // spin
      }
      timestamp = BigInt(Date.now() - epoch);
    }
  } else {
    sequence = 0n;
  }
  lastTimestamp = timestamp;

  const id =
    (timestamp << TIMESTAMP_SHIFT) |
    (BigInt(datacenterId) << DATACENTER_SHIFT) |
    (BigInt(workerId) << WORKER_SHIFT) |
    sequence;

  return id.toString();
}

function execute(input: Input): Output {
  const ids: string[] = [];
  for (let i = 0; i < input.count; i++) {
    ids.push(
      generateSnowflake(input.workerId, input.datacenterId, input.epoch)
    );
  }
  return { output: ids.join("\n") };
}

export const snowflakeIdGenerator = defineTool({
  meta: {
    id: "identifiers/snowflake-id-generator",
    name: "Snowflake ID Generator",
    description:
      "Free online Snowflake ID generator — create Twitter-style distributed unique identifiers instantly in your browser. No data is stored. Generates 64-bit IDs with configurable worker ID, datacenter ID, and custom epoch for distributed systems.",
    category: "identifiers",
    tier: ToolTier.CLIENT,
    keywords: [
      "snowflake",
      "generate",
      "twitter",
      "distributed",
      "identifier",
      "discord",
      "instagram",
    ],
    examples: [
      {
        title: "Default Snowflake ID",
        description:
          "Generate a Snowflake ID with default Twitter epoch. Output varies with current timestamp — bits 12-16 encode workerId, bits 17-21 encode datacenterId.",
        input: { count: 1, workerId: 1, datacenterId: 1, epoch: 1288834974657 },
        output: "7316717846122496",
      },
      {
        title: "Custom Worker and Datacenter",
        description:
          "Generate 3 Snowflake IDs for worker 5, datacenter 3. IDs are time-dependent; each run will produce different values.",
        input: { count: 3, workerId: 5, datacenterId: 3, epoch: 1288834974657 },
        output: "7316717846167557\n7316717846167558\n7316717846167559",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
