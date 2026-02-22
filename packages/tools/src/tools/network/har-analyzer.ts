import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("HAR file content (JSON)"),
});

const optionsSchema = z.object({
  showHeaders: z
    .boolean()
    .default(false)
    .describe("Include request/response headers"),
  filterStatus: z
    .string()
    .default("")
    .describe("Filter by status code (e.g., '4xx', '500')"),
  filterMime: z
    .string()
    .default("")
    .describe("Filter by MIME type (e.g., 'json', 'html')"),
});

const outputSchema = z.object({
  output: z.string().describe("HAR analysis summary"),
});

interface HarEntry {
  request: {
    method: string;
    url: string;
    headers?: Array<{ name: string; value: string }>;
    bodySize?: number;
  };
  response: {
    status: number;
    statusText: string;
    headers?: Array<{ name: string; value: string }>;
    content?: { size?: number; mimeType?: string };
    bodySize?: number;
  };
  time?: number;
  timings?: Record<string, number>;
}

function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");

  let har: Record<string, unknown>;
  try {
    har = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error("Input must be valid HAR JSON");
  }

  const log = har.log as Record<string, unknown>;
  if (!log) throw new Error("Invalid HAR format: missing 'log' property");

  const entries = (log.entries as HarEntry[]) ?? [];
  if (entries.length === 0) throw new Error("No entries found in HAR file");

  const showHeaders = options?.showHeaders ?? false;
  const filterStatus = options?.filterStatus?.trim() ?? "";
  const filterMime = options?.filterMime?.trim().toLowerCase() ?? "";

  let filtered = entries;

  if (filterStatus) {
    if (filterStatus.endsWith("xx")) {
      const prefix = filterStatus.charAt(0);
      filtered = filtered.filter((e) =>
        String(e.response.status).startsWith(prefix)
      );
    } else {
      const code = parseInt(filterStatus, 10);
      if (!isNaN(code))
        filtered = filtered.filter((e) => e.response.status === code);
    }
  }

  if (filterMime) {
    filtered = filtered.filter((e) =>
      (e.response.content?.mimeType ?? "").toLowerCase().includes(filterMime)
    );
  }

  // Summary stats
  const totalRequests = filtered.length;
  const totalTime = filtered.reduce((s, e) => s + (e.time ?? 0), 0);
  const totalSize = filtered.reduce(
    (s, e) => s + (e.response.content?.size ?? e.response.bodySize ?? 0),
    0
  );
  const statusCounts: Record<string, number> = {};
  const methodCounts: Record<string, number> = {};
  const domainCounts: Record<string, number> = {};

  for (const entry of filtered) {
    const status = String(entry.response.status);
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;
    methodCounts[entry.request.method] =
      (methodCounts[entry.request.method] ?? 0) + 1;
    try {
      const url = new URL(entry.request.url);
      domainCounts[url.hostname] = (domainCounts[url.hostname] ?? 0) + 1;
    } catch {
      /* ignore invalid URLs */
    }
  }

  const lines: string[] = [];
  lines.push("# HAR Analysis Summary");
  lines.push("");
  lines.push(`Total Requests: ${totalRequests}`);
  lines.push(`Total Time: ${totalTime.toFixed(0)}ms`);
  lines.push(`Total Size: ${(totalSize / 1024).toFixed(1)} KB`);
  lines.push("");

  lines.push("## Status Code Distribution");
  for (const [code, count] of Object.entries(statusCounts).sort()) {
    lines.push(`  ${code}: ${count} requests`);
  }
  lines.push("");

  lines.push("## HTTP Methods");
  for (const [method, count] of Object.entries(methodCounts).sort()) {
    lines.push(`  ${method}: ${count} requests`);
  }
  lines.push("");

  lines.push("## Domains");
  for (const [domain, count] of Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)) {
    lines.push(`  ${domain}: ${count} requests`);
  }
  lines.push("");

  // Slowest requests
  const sorted = [...filtered].sort((a, b) => (b.time ?? 0) - (a.time ?? 0));
  lines.push("## Slowest Requests (top 10)");
  for (const entry of sorted.slice(0, 10)) {
    const time = (entry.time ?? 0).toFixed(0);
    const size = ((entry.response.content?.size ?? 0) / 1024).toFixed(1);
    lines.push(
      `  ${time}ms | ${entry.response.status} | ${size}KB | ${entry.request.method} ${entry.request.url}`
    );
  }
  lines.push("");

  // Request details
  if (showHeaders) {
    lines.push("## Request Details");
    for (const entry of filtered.slice(0, 20)) {
      lines.push(`\n### ${entry.request.method} ${entry.request.url}`);
      lines.push(
        `Status: ${entry.response.status} ${entry.response.statusText}`
      );
      lines.push(`Time: ${(entry.time ?? 0).toFixed(0)}ms`);
      if (entry.request.headers && entry.request.headers.length > 0) {
        lines.push("Request Headers:");
        for (const h of entry.request.headers.slice(0, 10)) {
          lines.push(`  ${h.name}: ${h.value}`);
        }
      }
    }
  }

  return { output: lines.join("\n") };
}

export const harAnalyzer = defineTool({
  meta: {
    id: "network/har-analyzer",
    name: "HAR Analyzer",
    description:
      "Free online HAR file analyzer — paste HTTP Archive JSON and get request statistics, status code distribution, slowest requests, and domain breakdown instantly in your browser. No data is stored. Supports filtering by status code and MIME type.",
    category: "network",
    subgroup: "HTTP Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "har",
      "http",
      "archive",
      "analyze",
      "network",
      "performance",
      "waterfall",
      "requests",
      "status",
    ],
    ui: { inputLanguage: "json" as const, outputRenderer: "code" as const },
    examples: [
      {
        title: "Analyze single-request HAR file",
        description:
          "Get summary stats for a HAR file with one GET request to example.com",
        input:
          '{"log":{"entries":[{"request":{"method":"GET","url":"https://example.com/api"},"response":{"status":200,"statusText":"OK","content":{"size":1024,"mimeType":"application/json"}},"time":150}]}}',
        output:
          '{"output":"# HAR Analysis Summary\\n\\nTotal Requests: 1\\nTotal Time: 150ms\\nTotal Size: 1.0 KB\\n\\n## Status Code Distribution\\n  200: 1 requests\\n\\n## HTTP Methods\\n  GET: 1 requests\\n\\n## Domains\\n  example.com: 1 requests\\n\\n## Slowest Requests (top 10)\\n  150ms | 200 | 1.0KB | GET https://example.com/api\\n"}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
