"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface DiffChange {
  type: "add" | "delete" | "normal";
  content: string;
  lineNumber?: number;
}

interface DiffViewerProps {
  /**
   * Original text (left side)
   */
  original: string;
  /**
   * Modified text (right side)
   */
  modified: string;
  /**
   * View mode
   * @default "split"
   */
  mode?: "split" | "unified";
  /**
   * Whether to show line numbers
   * @default true
   */
  showLineNumbers?: boolean;
  /**
   * Whether to highlight character-level changes
   * @default true
   */
  highlightCharChanges?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Compute the Longest Common Subsequence (LCS) table for two arrays of lines.
 * Returns a 2D table where lcs[i][j] = length of LCS of a[0..i-1] and b[0..j-1].
 */
function computeLCS(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0)
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i]![j] = dp[i - 1]![j - 1]! + 1;
      } else {
        dp[i]![j] = Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
      }
    }
  }

  return dp;
}

/**
 * Backtrack through the LCS table to produce a proper diff with
 * correct handling of insertions, deletions, and unchanged lines.
 */
function computeDiff(original: string, modified: string): DiffChange[] {
  const originalLines = original.split("\n");
  const modifiedLines = modified.split("\n");
  const changes: DiffChange[] = [];

  const dp = computeLCS(originalLines, modifiedLines);

  // Backtrack to find the diff
  let i = originalLines.length;
  let j = modifiedLines.length;
  const result: DiffChange[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && originalLines[i - 1] === modifiedLines[j - 1]) {
      result.push({
        type: "normal",
        content: originalLines[i - 1]!,
        lineNumber: i,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i]![j - 1]! >= dp[i - 1]![j]!)) {
      result.push({
        type: "add",
        content: modifiedLines[j - 1]!,
        lineNumber: j,
      });
      j--;
    } else if (i > 0) {
      result.push({
        type: "delete",
        content: originalLines[i - 1]!,
        lineNumber: i,
      });
      i--;
    }
  }

  // Reverse since we built it backwards
  result.reverse();

  // Re-number lines for display: track original and modified line numbers
  let origLine = 0;
  let modLine = 0;
  for (const change of result) {
    if (change.type === "normal") {
      origLine++;
      modLine++;
      change.lineNumber = origLine;
    } else if (change.type === "delete") {
      origLine++;
      change.lineNumber = origLine;
    } else {
      modLine++;
      change.lineNumber = modLine;
    }
    changes.push(change);
  }

  return changes;
}

export function DiffViewer({
  original,
  modified,
  mode = "split",
  showLineNumbers = true,
  className,
}: DiffViewerProps): React.ReactElement {
  const changes = useMemo(
    () => computeDiff(original, modified),
    [original, modified]
  );

  if (mode === "unified") {
    return (
      <div
        className={cn("overflow-auto font-mono text-sm", className)}
        role="region"
        aria-label="Diff viewer"
      >
        <div className="min-w-full">
          {changes.map((change, index) => (
            <div
              key={`${change.type}-${change.lineNumber ?? index}-${change.content.slice(0, 20)}`}
              className={cn(
                "flex",
                change.type === "add" && "bg-green-500/10",
                change.type === "delete" && "bg-red-500/10"
              )}
            >
              {showLineNumbers && (
                <span className="text-muted-foreground border-border w-12 border-r px-2 py-0.5 text-right select-none">
                  {change.lineNumber}
                </span>
              )}
              <span className="w-6 py-0.5 text-center select-none">
                {change.type === "add" && (
                  <span className="text-green-500">+</span>
                )}
                {change.type === "delete" && (
                  <span className="text-red-500">-</span>
                )}
              </span>
              <pre className="flex-1 px-2 py-0.5 break-all whitespace-pre-wrap">
                {change.content}
              </pre>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Split mode
  const originalChanges = changes.filter((c) => c.type !== "add");
  const modifiedChanges = changes.filter((c) => c.type !== "delete");

  return (
    <div
      className={cn("overflow-auto font-mono text-sm", className)}
      role="region"
      aria-label="Diff viewer"
    >
      <div className="flex min-w-full">
        {/* Original (left) */}
        <div
          className="border-border flex-1 border-r"
          role="region"
          aria-label="Original content"
        >
          <div className="bg-muted px-2 py-1 text-xs font-medium">Original</div>
          {originalChanges.map((change, index) => (
            <div
              key={`orig-${change.type}-${change.lineNumber ?? index}-${change.content.slice(0, 20)}`}
              className={cn(
                "flex",
                change.type === "delete" && "bg-red-500/10"
              )}
            >
              {showLineNumbers && (
                <span className="text-muted-foreground border-border w-12 border-r px-2 py-0.5 text-right select-none">
                  {change.lineNumber}
                </span>
              )}
              <pre className="flex-1 px-2 py-0.5 break-all whitespace-pre-wrap">
                {change.content}
              </pre>
            </div>
          ))}
        </div>

        {/* Modified (right) */}
        <div className="flex-1" role="region" aria-label="Modified content">
          <div className="bg-muted px-2 py-1 text-xs font-medium">Modified</div>
          {modifiedChanges.map((change, index) => (
            <div
              key={`mod-${change.type}-${change.lineNumber ?? index}-${change.content.slice(0, 20)}`}
              className={cn("flex", change.type === "add" && "bg-green-500/10")}
            >
              {showLineNumbers && (
                <span className="text-muted-foreground border-border w-12 border-r px-2 py-0.5 text-right select-none">
                  {change.lineNumber}
                </span>
              )}
              <pre className="flex-1 px-2 py-0.5 break-all whitespace-pre-wrap">
                {change.content}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
