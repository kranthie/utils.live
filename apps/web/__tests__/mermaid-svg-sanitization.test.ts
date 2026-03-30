import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import DOMPurify from "dompurify";

describe("Mermaid SVG DOMPurify sanitization", () => {
  it("strips onload event handlers from SVG", () => {
    const maliciousSvg = `<svg xmlns="http://www.w3.org/2000/svg"><rect onload="alert(1)" width="100" height="100"/></svg>`;
    const sanitized = DOMPurify.sanitize(maliciousSvg, {
      USE_PROFILES: { svg: true, svgFilters: true },
    });
    expect(sanitized).not.toContain("onload");
    expect(sanitized).not.toContain("alert");
  });

  it("strips onclick event handlers from SVG elements", () => {
    const maliciousSvg = `<svg xmlns="http://www.w3.org/2000/svg"><circle onclick="fetch('https://evil.com')" r="50"/></svg>`;
    const sanitized = DOMPurify.sanitize(maliciousSvg, {
      USE_PROFILES: { svg: true, svgFilters: true },
    });
    expect(sanitized).not.toContain("onclick");
    expect(sanitized).not.toContain("fetch");
  });

  it("strips javascript: href from SVG anchor elements", () => {
    const maliciousSvg = `<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)"><text>click</text></a></svg>`;
    const sanitized = DOMPurify.sanitize(maliciousSvg, {
      USE_PROFILES: { svg: true, svgFilters: true },
    });
    expect(sanitized).not.toContain("javascript:");
  });

  it("preserves safe SVG structure", () => {
    const safeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="blue"/></svg>`;
    const sanitized = DOMPurify.sanitize(safeSvg, {
      USE_PROFILES: { svg: true, svgFilters: true },
    });
    expect(sanitized).toContain("<svg");
    expect(sanitized).toContain("<rect");
    expect(sanitized).toContain('fill="blue"');
  });

  it("mermaid-renderer uses DOMPurify with svg profile", () => {
    const source = readFileSync(
      resolve(__dirname, "../components/renderers/mermaid-renderer.tsx"),
      "utf-8"
    );
    expect(source).toContain("DOMPurify.sanitize");
    expect(source).toContain("USE_PROFILES");
    expect(source).toContain("svg: true");
  });
});
