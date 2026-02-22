import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("Content Security Policy", () => {
  const headersPath = resolve(__dirname, "../public/_headers");

  let source: string;

  try {
    source = readFileSync(headersPath, "utf-8");
  } catch {
    source = "";
  }

  it("should have a non-empty _headers file", () => {
    expect(source.length).toBeGreaterThan(0);
  });

  it("should include unsafe-eval in script-src for Monaco editor support", () => {
    // Monaco editor requires unsafe-eval for its web workers
    expect(source).toContain("'unsafe-eval'");
  });

  it("should define a default-src directive", () => {
    // A CSP without default-src falls back to allowing everything
    expect(source).toContain("default-src");
  });

  it("should restrict frame-ancestors to prevent clickjacking", () => {
    // frame-ancestors 'none' or 'self' prevents the page from being embedded
    expect(source).toMatch(/frame-ancestors\s+'none'/);
  });
});
