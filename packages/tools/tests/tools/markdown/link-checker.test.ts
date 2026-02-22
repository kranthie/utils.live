import { describe, it, expect } from "vitest";
import { markdownLinkChecker } from "../../../src/tools/markdown/link-checker";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface LinkCheckerData {
  totalLinks: number;
  links: Array<{
    text: string;
    url: string;
    type: string;
    valid: boolean;
    issue?: string;
    line?: number;
  }>;
  summary: {
    urls: number;
    anchors: number;
    relative: number;
    emails: number;
    invalid: number;
  };
}

describe("markdownLinkChecker", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(markdownLinkChecker.meta.id).toBe("markdown/link-checker");
      expect(markdownLinkChecker.meta.name).toBe("Markdown Link Checker");
      expect(markdownLinkChecker.meta.category).toBe("markdown");
      expect(markdownLinkChecker.meta.tier).toBe(ToolTier.CLIENT);
      expect(markdownLinkChecker.meta.keywords).toContain("link");
      expect(markdownLinkChecker.meta.keywords).toContain("check");
    });
  });

  describe("execute", () => {
    it("should detect markdown links", async () => {
      const result = await executeTool(markdownLinkChecker, {
        input: "[Link text](https://example.com)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkCheckerData;
        expect(data.totalLinks).toBe(1);
        expect(data.links[0]).toMatchObject({
          text: "Link text",
          url: "https://example.com",
          type: "url",
          valid: true,
        });
      }
    });

    it("should identify anchor links", async () => {
      const result = await executeTool(markdownLinkChecker, {
        input: "[Section](#section-name)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkCheckerData;
        expect(data.links[0]?.type).toBe("anchor");
      }
    });

    it("should identify relative links", async () => {
      const result = await executeTool(markdownLinkChecker, {
        input:
          "[Docs](./docs/guide.md)\n[Parent](../README.md)\n[Root](/index.html)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkCheckerData;
        expect(data.links.every((l) => l.type === "relative")).toBe(true);
      }
    });

    it("should identify email links", async () => {
      const result = await executeTool(markdownLinkChecker, {
        input: "[Email](mailto:test@example.com)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkCheckerData;
        expect(data.links[0]?.type).toBe("email");
      }
    });

    it("should detect empty URLs", async () => {
      const result = await executeTool(markdownLinkChecker, {
        input: "[Empty]()",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkCheckerData;
        expect(data.links[0]?.valid).toBe(false);
        expect(data.links[0]?.issue).toContain("Empty URL");
      }
    });

    it("should detect unresolved template variables", async () => {
      const result = await executeTool(markdownLinkChecker, {
        input: "[Link](https://example.com/{{variable}})",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkCheckerData;
        expect(data.links[0]?.valid).toBe(false);
        expect(data.links[0]?.issue).toContain("template variable");
      }
    });

    it("should detect unencoded spaces", async () => {
      const result = await executeTool(markdownLinkChecker, {
        input: "[Link](https://example.com/path with spaces)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkCheckerData;
        expect(data.links[0]?.valid).toBe(false);
        expect(data.links[0]?.issue).toContain("unencoded spaces");
      }
    });

    it("should warn about HTTP links", async () => {
      const result = await executeTool(markdownLinkChecker, {
        input: "[Insecure](http://example.com)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkCheckerData;
        expect(data.links[0]?.valid).toBe(true);
        expect(data.links[0]?.issue).toContain("HTTPS");
      }
    });

    it("should not warn about localhost HTTP", async () => {
      const result = await executeTool(markdownLinkChecker, {
        input: "[Local](http://localhost:3000)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkCheckerData;
        expect(data.links[0]?.issue).toBeUndefined();
      }
    });

    it("should detect invalid URL format", async () => {
      const result = await executeTool(markdownLinkChecker, {
        input: "[Invalid](https://)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkCheckerData;
        expect(data.links[0]?.valid).toBe(false);
        expect(data.links[0]?.issue).toContain("Invalid URL");
      }
    });

    it("should detect bare URLs", async () => {
      const result = await executeTool(markdownLinkChecker, {
        input: "Check out https://example.com for more info",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkCheckerData;
        expect(data.totalLinks).toBe(1);
        expect(data.links[0]?.text).toBe("(bare URL)");
        expect(data.links[0]?.issue).toContain("wrapping");
      }
    });

    it("should track line numbers", async () => {
      const result = await executeTool(markdownLinkChecker, {
        input: "Line 1\n[Link1](url1)\nLine 3\n[Link2](url2)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkCheckerData;
        expect(data.links[0]?.line).toBe(2);
        expect(data.links[1]?.line).toBe(4);
      }
    });

    it("should provide summary statistics", async () => {
      const result = await executeTool(markdownLinkChecker, {
        input: `[URL](https://example.com)
[Anchor](#section)
[Relative](./file.md)
[Email](mailto:test@test.com)
[Invalid]()`,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkCheckerData;
        expect(data.summary.urls).toBeGreaterThanOrEqual(1);
        expect(data.summary.anchors).toBeGreaterThanOrEqual(1);
        expect(data.summary.relative).toBeGreaterThanOrEqual(1);
        expect(data.summary.emails).toBeGreaterThanOrEqual(1);
        expect(data.summary.invalid).toBeGreaterThanOrEqual(1);
      }
    });

    it("should handle document with no links", async () => {
      const result = await executeTool(markdownLinkChecker, {
        input: "# Just text\n\nNo links here.",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkCheckerData;
        expect(data.totalLinks).toBe(0);
        expect(data.links).toEqual([]);
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(markdownLinkChecker, {
        input: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkCheckerData;
        expect(data.totalLinks).toBe(0);
      }
    });

    it("should handle multiple links on same line", async () => {
      const result = await executeTool(markdownLinkChecker, {
        input: "[One](url1) and [Two](url2) and [Three](url3)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkCheckerData;
        expect(data.totalLinks).toBe(3);
        expect(data.links.every((l) => l.line === 1)).toBe(true);
      }
    });

    it("should validate complex document", async () => {
      const markdown = `# Documentation

See [our website](https://example.com) for details.

## Sections

- [Installation](#installation)
- [Usage](#usage)

## Links

Contact us at [email](mailto:info@example.com).

Check [broken]() link and [template](https://example.com/{{var}}).

Visit http://insecure.com for old docs.
`;

      const result = await executeTool(markdownLinkChecker, {
        input: markdown,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkCheckerData;
        expect(data.totalLinks).toBeGreaterThan(5);
        expect(data.summary.invalid).toBeGreaterThan(0);
      }
    });

    it("should not duplicate bare URLs that are in links", async () => {
      const result = await executeTool(markdownLinkChecker, {
        input: "[https://example.com](https://example.com)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkCheckerData;
        // Should only count the markdown link, not as bare URL
        expect(data.totalLinks).toBe(1);
      }
    });
  });
});
