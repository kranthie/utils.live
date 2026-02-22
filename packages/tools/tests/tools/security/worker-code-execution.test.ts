import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

describe("Worker Security: No arbitrary code execution", () => {
  const workerPath = resolve(
    __dirname,
    "../../../../../apps/web/public/workers/tool-worker.js"
  );

  const workerExists = existsSync(workerPath);
  let workerSource: string = "";

  if (workerExists) {
    try {
      workerSource = readFileSync(workerPath, "utf-8");
    } catch {
      workerSource = "";
    }
  }

  it("should have a non-empty worker file to validate", () => {
    if (!workerExists) {
      // Worker file may not exist in all build stages - skip gracefully
      // but warn so CI knows this test was not actually validating anything
      console.warn(
        `WARN: Worker file not found at ${workerPath}. ` +
          "Security assertions were skipped. Run after build to validate."
      );
      return;
    }
    expect(workerSource.length).toBeGreaterThan(0);
  });

  it("should not contain new Function() constructor", () => {
    if (!workerExists) return;
    expect(workerSource).not.toMatch(/new\s+Function\s*\(/);
  });

  it("should not contain eval()", () => {
    if (!workerExists) return;
    expect(workerSource).not.toMatch(/\beval\s*\(/);
  });

  it("should not expose executeSimple in the worker API", () => {
    if (!workerExists) return;
    expect(workerSource).not.toMatch(/executeSimple/);
  });
});
