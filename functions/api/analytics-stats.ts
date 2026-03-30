interface Env {
  ANALYTICS_KV: KVNamespace;
}

interface EventCounts {
  views: number;
  executions: number;
  copies: number;
}

interface ToolStats {
  toolId: string;
  views: number;
  executions: number;
  copies: number;
}

/**
 * Returns aggregated analytics for the last N days.
 * Query: GET /api/analytics-stats?days=7
 */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const days = Math.min(parseInt(url.searchParams.get("days") ?? "7", 10), 90);

  const dates: string[] = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }

  // List all keys for the date range
  const toolStats: Record<string, EventCounts> = {};

  for (const date of dates) {
    const prefix = `stats:${date}:`;
    const list = await env.ANALYTICS_KV.list({ prefix });
    for (const key of list.keys) {
      const toolId = key.name.slice(prefix.length);
      const raw = await env.ANALYTICS_KV.get(key.name);
      if (!raw) continue;
      const counts = JSON.parse(raw) as EventCounts;
      if (!toolStats[toolId]) {
        toolStats[toolId] = { views: 0, executions: 0, copies: 0 };
      }
      toolStats[toolId]!.views += counts.views;
      toolStats[toolId]!.executions += counts.executions;
      toolStats[toolId]!.copies += counts.copies;
    }
  }

  const sorted: ToolStats[] = Object.entries(toolStats)
    .map(([toolId, counts]) => ({ toolId, ...counts }))
    .sort((a, b) => b.executions - a.executions);

  return new Response(
    JSON.stringify({ days, tools: sorted }, null, 2),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "https://utils.live",
        "Cache-Control": "public, max-age=300",
      },
    }
  );
};
