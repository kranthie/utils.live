import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  requests: z
    .number()
    .min(1)
    .max(1000000)
    .default(100)
    .describe("Number of requests allowed"),
  windowSeconds: z
    .number()
    .min(1)
    .max(86400)
    .default(60)
    .describe("Time window in seconds"),
  burstSize: z
    .number()
    .min(1)
    .max(10000)
    .default(10)
    .describe("Burst size (token bucket)"),
});

const outputSchema = z.object({
  output: z.string().describe("Rate limit calculations"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const rps = input.requests / input.windowSeconds;
  const rpm = rps * 60;
  const rph = rps * 3600;
  const rpd = rps * 86400;

  const intervalMs = (input.windowSeconds / input.requests) * 1000;
  const tokenRefillRate = rps;
  const tokenRefillInterval = 1 / tokenRefillRate;

  const lines: string[] = [];
  lines.push("=== Rate Limit Calculator ===");
  lines.push("");
  lines.push(`Configuration:`);
  lines.push(`  Requests: ${input.requests}`);
  lines.push(`  Window: ${input.windowSeconds}s`);
  lines.push(`  Burst: ${input.burstSize}`);
  lines.push("");
  lines.push("Rates:");
  lines.push(`  ${rps.toFixed(2)} requests/second`);
  lines.push(`  ${rpm.toFixed(2)} requests/minute`);
  lines.push(`  ${rph.toFixed(2)} requests/hour`);
  lines.push(`  ${rpd.toFixed(0)} requests/day`);
  lines.push("");
  lines.push("Intervals:");
  lines.push(`  Min interval between requests: ${intervalMs.toFixed(2)}ms`);
  lines.push("");
  lines.push("Token Bucket:");
  lines.push(`  Bucket size: ${input.burstSize}`);
  lines.push(`  Refill rate: ${tokenRefillRate.toFixed(4)} tokens/second`);
  lines.push(
    `  Refill interval: ${(tokenRefillInterval * 1000).toFixed(2)}ms per token`
  );
  lines.push(
    `  Time to refill bucket: ${(input.burstSize * tokenRefillInterval).toFixed(2)}s`
  );
  lines.push("");
  lines.push("Sliding Window:");
  lines.push(`  Window size: ${input.windowSeconds}s`);
  lines.push(`  Max in window: ${input.requests}`);

  return { output: lines.join("\n") };
}

// FIXME(category-mismatch): Tool belongs in 'network' category, not 'datetime'. Tracked in DC-006.
export const rateLimiterCalculator = defineTool({
  meta: {
    id: "datetime/rate-limiter-calculator",
    name: "Rate Limiter Calculator",
    description:
      "Free online rate limiter calculator — compute rate limiting parameters and conversions instantly in your browser. No data is stored. Shows requests per second/minute/hour, token bucket, and sliding window analysis.",
    category: "datetime",
    subgroup: "Cron & Scheduling",
    tier: ToolTier.CLIENT,
    keywords: ["rate", "limit", "throttle", "calculate", "api"],
    examples: [
      {
        title: "API Rate Limit",
        description:
          "Calculate rate limiting for 100 requests per minute with burst of 10",
        input: { requests: 100, windowSeconds: 60, burstSize: 10 },
        output:
          "=== Rate Limit Calculator ===\n\nConfiguration:\n  Requests: 100\n  Window: 60s\n  Burst: 10\n\nRates:\n  1.67 requests/second\n  100.00 requests/minute\n  6000.00 requests/hour\n  144000 requests/day\n\nIntervals:\n  Min interval between requests: 600.00ms\n\nToken Bucket:\n  Bucket size: 10\n  Refill rate: 1.6667 tokens/second\n  Refill interval: 600.00ms per token\n  Time to refill bucket: 6.00s\n\nSliding Window:\n  Window size: 60s\n  Max in window: 100",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
