interface Env {
  ANALYTICS_KV: KVNamespace;
}

interface AnalyticsEvent {
  event: "tool_view" | "tool_execute" | "tool_copy";
  toolId: string;
  category?: string;
}

interface EventCounts {
  views: number;
  executions: number;
  copies: number;
}

function getDateKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // CORS
  const headers = {
    "Access-Control-Allow-Origin": "https://utils.live",
    "Content-Type": "application/json",
  };

  let body: AnalyticsEvent;
  try {
    body = (await request.json()) as AnalyticsEvent;
  } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 400, headers });
  }

  const { event, toolId } = body;
  if (!event || !toolId || typeof toolId !== "string") {
    return new Response(JSON.stringify({ ok: false }), { status: 400, headers });
  }

  // Sanitize: only allow safe characters in toolId (prevent key injection)
  if (!/^[a-z0-9/_-]+$/.test(toolId)) {
    return new Response(JSON.stringify({ ok: false }), { status: 400, headers });
  }

  const dateKey = getDateKey();
  const kvKey = `stats:${dateKey}:${toolId}`;

  try {
    const existing = await env.ANALYTICS_KV.get(kvKey);
    const counts: EventCounts = existing
      ? (JSON.parse(existing) as EventCounts)
      : { views: 0, executions: 0, copies: 0 };

    if (event === "tool_view") counts.views++;
    else if (event === "tool_execute") counts.executions++;
    else if (event === "tool_copy") counts.copies++;

    // Retain each day's stats for 90 days
    await env.ANALYTICS_KV.put(kvKey, JSON.stringify(counts), {
      expirationTtl: 90 * 24 * 60 * 60,
    });
  } catch {
    // Non-fatal: analytics write failure should not break the user experience
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "https://utils.live",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};
