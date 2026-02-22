import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

describe("HTML Preview Security", () => {
  const componentPath = resolve(
    __dirname,
    "../components/renderers/html-preview.tsx"
  );

  const fileExists = existsSync(componentPath);
  let source: string = "";

  if (fileExists) {
    try {
      source = readFileSync(componentPath, "utf-8");
    } catch {
      source = "";
    }
  }

  it("should have a non-empty component file to validate", () => {
    expect(fileExists).toBe(true);
    expect(source.length).toBeGreaterThan(0);
  });

  it("should not use allow-same-origin in sandbox", () => {
    expect(source).not.toContain("allow-same-origin");
  });

  it("should use srcdoc instead of doc.write", () => {
    expect(source).not.toMatch(/doc\.write\s*\(/);
    expect(source).toContain("srcdoc");
  });

  it("should not create unsandboxed blob URLs for HTML content", () => {
    // The handleOpenInNewTab function should not use blob URLs with raw HTML
    expect(source).not.toMatch(/new\s+Blob\s*\(\s*\[content\]/);
  });
});
