"use client";

import { useCallback, useEffect, useRef } from "react";

type AnalyticsEvent = "tool_view" | "tool_execute" | "tool_copy";

interface AnalyticsPayload {
  event: AnalyticsEvent;
  toolId: string;
  category?: string;
}

const ANALYTICS_ENDPOINT = "/api/analytics";

function sendEvent(payload: AnalyticsPayload): void {
  if (typeof navigator === "undefined") return;

  const body = JSON.stringify(payload);

  // Prefer sendBeacon (fire-and-forget, survives page unloads)
  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      ANALYTICS_ENDPOINT,
      new Blob([body], { type: "application/json" })
    );
    return;
  }

  // Fallback for environments where sendBeacon is unavailable
  void fetch(ANALYTICS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // Analytics failures are non-fatal
  });
}

interface UseAnalyticsReturn {
  /** Track when a tool is executed (Run button / keyboard shortcut) */
  trackExecute: () => void;
  /** Track when the tool output is copied */
  trackCopy: () => void;
}

/**
 * Lightweight analytics hook for tool pages.
 *
 * - Fires a `tool_view` event once on mount
 * - Exposes `trackExecute` and `trackCopy` callbacks
 * - All events are sent via `navigator.sendBeacon` (fire-and-forget, no PII)
 */
export function useAnalytics(
  toolId: string,
  category?: string
): UseAnalyticsReturn {
  const viewedRef = useRef(false);

  // Track page view once per mount
  useEffect(() => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    sendEvent({ event: "tool_view", toolId, category });
  }, [toolId, category]);

  const trackExecute = useCallback(() => {
    sendEvent({ event: "tool_execute", toolId, category });
  }, [toolId, category]);

  const trackCopy = useCallback(() => {
    sendEvent({ event: "tool_copy", toolId, category });
  }, [toolId, category]);

  return { trackExecute, trackCopy };
}
