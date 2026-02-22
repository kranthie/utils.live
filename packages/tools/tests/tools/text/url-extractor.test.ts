import { describe, it, expect } from "vitest";
import { urlExtractor } from "../../../src/tools/text/url-extractor";
import { executeTool } from "../../../src/core/executor";

describe("urlExtractor", () => {
  describe("meta", () => {
    it("should have correct tool metadata", () => {
      expect(urlExtractor.meta.id).toBe("text/url-extractor");
      expect(urlExtractor.meta.name).toBe("URL Extractor");
      expect(urlExtractor.meta.category).toBe("text");
    });
  });

  describe("execute", () => {
    describe("URL formats", () => {
      it("should extract HTTP URLs", async () => {
        const result = await executeTool(urlExtractor, {
          input: "Visit http://example.com for more info",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).urls).toContain(
            "http://example.com"
          );
          expect((result.data as Record<string, unknown>).count).toBe(1);
        }
      });

      it("should extract HTTPS URLs", async () => {
        const result = await executeTool(urlExtractor, {
          input: "Secure site: https://secure.example.com",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).urls).toContain(
            "https://secure.example.com"
          );
        }
      });

      it("should extract URLs with paths", async () => {
        const result = await executeTool(urlExtractor, {
          input: "Check https://example.com/path/to/page",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).urls[0]).toContain(
            "/path/to/page"
          );
        }
      });

      it("should extract URLs with query strings", async () => {
        const result = await executeTool(urlExtractor, {
          input: "Link: https://example.com?query=value&other=123",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).urls[0]).toContain(
            "query=value"
          );
        }
      });

      it("should extract www URLs without protocol", async () => {
        const result = await executeTool(urlExtractor, {
          input: "Visit www.example.com today",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).urls).toContain(
            "www.example.com"
          );
        }
      });
    });

    describe("multiple URLs", () => {
      it("should extract multiple URLs", async () => {
        const result = await executeTool(urlExtractor, {
          input: "Check https://first.com and https://second.com for details",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).count).toBe(2);
          expect((result.data as Record<string, unknown>).urls).toContain(
            "https://first.com"
          );
          expect((result.data as Record<string, unknown>).urls).toContain(
            "https://second.com"
          );
        }
      });

      it("should return unique URLs by default", async () => {
        const result = await executeTool(urlExtractor, {
          input: "https://example.com repeated https://example.com again",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).urls.length).toBe(1);
        }
      });
    });

    describe("domains and protocols", () => {
      it("should extract unique domains", async () => {
        const result = await executeTool(urlExtractor, {
          input:
            "https://example.com/page1 and https://example.com/page2 and https://other.com",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).domains).toContain(
            "example.com"
          );
          expect((result.data as Record<string, unknown>).domains).toContain(
            "other.com"
          );
          expect((result.data as Record<string, unknown>).domains.length).toBe(
            2
          );
        }
      });

      it("should identify protocols", async () => {
        const result = await executeTool(urlExtractor, {
          input: "http://http.com and https://https.com",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).protocols).toContain(
            "http"
          );
          expect((result.data as Record<string, unknown>).protocols).toContain(
            "https"
          );
        }
      });

      it("should handle www URLs as none protocol", async () => {
        const result = await executeTool(urlExtractor, {
          input: "www.example.com",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).protocols).toContain(
            "none"
          );
        }
      });
    });

    describe("options", () => {
      it("should not include protocolless URLs when disabled", async () => {
        const result = await executeTool(
          urlExtractor,
          { input: "Visit www.example.com today" },
          { includeProtocolless: false }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).urls).not.toContain(
            "www.example.com"
          );
        }
      });

      it("should include protocolless URLs by default", async () => {
        const result = await executeTool(urlExtractor, {
          input: "Visit www.example.com today",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).urls.length
          ).toBeGreaterThan(0);
        }
      });
    });

    describe("punctuation handling", () => {
      it("should remove trailing punctuation", async () => {
        const result = await executeTool(urlExtractor, {
          input: "Check https://example.com.",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).urls[0]).not.toMatch(
            /\.$/
          );
        }
      });

      it("should remove trailing comma", async () => {
        const result = await executeTool(urlExtractor, {
          input: "Sites: https://first.com, https://second.com",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          for (const url of (result.data as Record<string, unknown>).urls) {
            expect(url).not.toMatch(/,$/);
          }
        }
      });

      it("should remove multiple trailing punctuation", async () => {
        const result = await executeTool(urlExtractor, {
          input: "Visit https://example.com!?",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).urls[0]).not.toMatch(
            /[!?]$/
          );
        }
      });
    });

    describe("edge cases", () => {
      it("should handle empty input", async () => {
        const result = await executeTool(urlExtractor, { input: "" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).urls).toEqual([]);
          expect((result.data as Record<string, unknown>).count).toBe(0);
          expect((result.data as Record<string, unknown>).unique).toEqual([]);
          expect((result.data as Record<string, unknown>).domains).toEqual([]);
          expect((result.data as Record<string, unknown>).protocols).toEqual(
            []
          );
        }
      });

      it("should handle text without URLs", async () => {
        const result = await executeTool(urlExtractor, {
          input: "No URLs in this text at all",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).urls).toEqual([]);
          expect((result.data as Record<string, unknown>).count).toBe(0);
        }
      });

      it("should handle URLs with ports", async () => {
        const result = await executeTool(urlExtractor, {
          input: "Local server: http://localhost:3000",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).urls[0]).toContain(
            ":3000"
          );
        }
      });

      it("should handle URLs with fragments", async () => {
        const result = await executeTool(urlExtractor, {
          input: "https://example.com/page#section",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).urls[0]).toContain(
            "#section"
          );
        }
      });

      it("should handle complex URLs", async () => {
        const result = await executeTool(urlExtractor, {
          input: "https://user:pass@example.com:8080/path?q=1&r=2#hash",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).count).toBe(1);
        }
      });

      it("should not duplicate www URLs already captured with protocol", async () => {
        const result = await executeTool(urlExtractor, {
          input: "https://www.example.com is a site",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).count).toBe(1);
        }
      });

      it("should handle subdomains", async () => {
        const result = await executeTool(urlExtractor, {
          input: "https://sub.domain.example.com/path",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).domains).toContain(
            "sub.domain.example.com"
          );
        }
      });
    });
  });
});
