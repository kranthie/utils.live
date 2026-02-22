import { describe, it, expect } from "vitest";
import { plagiarismHighlighter } from "../../../src/tools/text/plagiarism-highlighter";
import { executeTool } from "../../../src/core/executor";

describe("plagiarismHighlighter", () => {
  describe("meta", () => {
    it("should have correct tool metadata", () => {
      expect(plagiarismHighlighter.meta.id).toBe("text/plagiarism-highlighter");
      expect(plagiarismHighlighter.meta.name).toBe("Text Overlap Finder");
      expect(plagiarismHighlighter.meta.category).toBe("text");
    });
  });

  describe("execute", () => {
    describe("basic matching", () => {
      it("should find exact matching phrases", async () => {
        const source =
          "The quick brown fox jumps over the lazy dog in the morning.";
        const comparison =
          "Yesterday, the quick brown fox jumps over the lazy dog at noon.";

        const result = await executeTool(plagiarismHighlighter, {
          source,
          comparison,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const matches = data.matches as Record<string, unknown>[];
          expect(matches.length).toBeGreaterThan(0);
          // Should find the common phrase
          const matchTexts = matches.map((m: Record<string, unknown>) =>
            (m.text as string).toLowerCase()
          );
          const hasCommonPhrase = matchTexts.some(
            (t: string) =>
              t.includes("the quick brown fox jumps over the lazy dog") ||
              t.includes("quick brown fox jumps over the lazy dog")
          );
          expect(hasCommonPhrase).toBe(true);
        }
      });

      it("should detect identical texts", async () => {
        const text = "This is a sample text that should match completely.";

        const result = await executeTool(plagiarismHighlighter, {
          source: text,
          comparison: text,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const matches = data.matches as Record<string, unknown>[];
          expect(data.similarityScore).toBe(100);
          expect(matches.length).toBe(1);
          expect(matches[0]?.text).toBe(text);
        }
      });

      it("should return no matches for completely different texts", async () => {
        const source = "Apples and oranges are fruits.";
        const comparison = "Dogs and cats are pets.";

        const result = await executeTool(plagiarismHighlighter, {
          source,
          comparison,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const matches = data.matches as Record<string, unknown>[];
          expect(matches.length).toBe(0);
          expect(data.similarityScore).toBe(0);
          expect(data.highlightedSource).toBe(source);
          expect(data.highlightedComparison).toBe(comparison);
        }
      });
    });

    describe("match positions", () => {
      it("should return correct positions for matches", async () => {
        const source = "Hello world, this is a test sentence for testing.";
        const comparison = "Yes, this is a test sentence here.";

        const result = await executeTool(plagiarismHighlighter, {
          source,
          comparison,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const matches = data.matches as Record<string, unknown>[];
          for (const match of matches) {
            // Verify source positions
            expect(
              source.substring(
                match.sourceStart as number,
                match.sourceEnd as number
              )
            ).toBe(match.text);
            // Verify comparison positions (case-insensitive match)
            const comparisonSubstr = comparison.substring(
              match.comparisonStart as number,
              match.comparisonEnd as number
            );
            expect(comparisonSubstr.toLowerCase()).toBe(
              (match.text as string).toLowerCase()
            );
          }
        }
      });
    });

    describe("highlighting", () => {
      it("should highlight matched portions with markers", async () => {
        const source = "The quick brown fox jumps over the lazy dog.";
        const comparison = "A quick brown fox jumps over something.";

        const result = await executeTool(plagiarismHighlighter, {
          source,
          comparison,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          expect(data.highlightedSource as string).toContain("[[");
          expect(data.highlightedSource as string).toContain("]]");
          expect(data.highlightedComparison as string).toContain("[[");
          expect(data.highlightedComparison as string).toContain("]]");
        }
      });

      it("should preserve non-matched text in highlighting", async () => {
        const source = "START common phrase END";
        const comparison = "BEGIN common phrase FINISH";

        const result = await executeTool(
          plagiarismHighlighter,
          {
            source,
            comparison,
          },
          { minMatchLength: 10 }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          expect(data.highlightedSource as string).toContain("START");
          expect(data.highlightedSource as string).toContain("END");
          expect(data.highlightedComparison as string).toContain("BEGIN");
          expect(data.highlightedComparison as string).toContain("FINISH");
        }
      });
    });

    describe("similarity score", () => {
      it("should return 100% for identical texts", async () => {
        const text = "This is exactly the same content in both documents.";

        const result = await executeTool(plagiarismHighlighter, {
          source: text,
          comparison: text,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).similarityScore).toBe(
            100
          );
        }
      });

      it("should return 0% for completely different texts", async () => {
        const source = "AAAAAAAAAAAAAAAAAAAAAAAAA";
        const comparison = "BBBBBBBBBBBBBBBBBBBBBBBBB";

        const result = await executeTool(plagiarismHighlighter, {
          source,
          comparison,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).similarityScore).toBe(
            0
          );
        }
      });

      it("should return partial score for partially matching texts", async () => {
        const source =
          "The quick brown fox jumps over the lazy dog. UNIQUE CONTENT HERE.";
        const comparison =
          "The quick brown fox jumps over the lazy dog. DIFFERENT STUFF HERE.";

        const result = await executeTool(plagiarismHighlighter, {
          source,
          comparison,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          expect(data.similarityScore as number).toBeGreaterThan(0);
          expect(data.similarityScore as number).toBeLessThan(100);
        }
      });
    });

    describe("options", () => {
      describe("minMatchLength", () => {
        it("should respect minimum match length", async () => {
          const source = "short phrase is here";
          const comparison = "the short phrase is there";

          // With high minMatchLength, should find no matches
          const result = await executeTool(
            plagiarismHighlighter,
            {
              source,
              comparison,
            },
            { minMatchLength: 30 }
          );

          expect(result.success).toBe(true);
          if (result.success) {
            const matches = (result.data as Record<string, unknown>)
              .matches as Record<string, unknown>[];
            expect(matches.length).toBe(0);
          }
        });

        it("should find shorter matches with lower minMatchLength", async () => {
          const source = "short phrase here";
          const comparison = "a short phrase there";

          const result = await executeTool(
            plagiarismHighlighter,
            {
              source,
              comparison,
            },
            { minMatchLength: 5 }
          );

          expect(result.success).toBe(true);
          if (result.success) {
            const matches = (result.data as Record<string, unknown>)
              .matches as Record<string, unknown>[];
            expect(matches.length).toBeGreaterThan(0);
          }
        });
      });

      describe("caseSensitive", () => {
        it("should be case-insensitive by default", async () => {
          const source = "THE QUICK BROWN FOX JUMPS OVER";
          const comparison = "the quick brown fox jumps over";

          const result = await executeTool(plagiarismHighlighter, {
            source,
            comparison,
          });

          expect(result.success).toBe(true);
          if (result.success) {
            expect(
              (result.data as Record<string, unknown>).similarityScore
            ).toBe(100);
          }
        });

        it("should respect case when caseSensitive is true", async () => {
          const source = "THE QUICK BROWN FOX JUMPS OVER";
          const comparison = "the quick brown fox jumps over";

          const result = await executeTool(
            plagiarismHighlighter,
            {
              source,
              comparison,
            },
            { caseSensitive: true }
          );

          expect(result.success).toBe(true);
          if (result.success) {
            const data = result.data as Record<string, unknown>;
            const matches = data.matches as Record<string, unknown>[];
            // No matches since case is different
            expect(matches.length).toBe(0);
            expect(data.similarityScore).toBe(0);
          }
        });

        it("should find case-sensitive matches when they exist", async () => {
          const source = "The Quick Brown Fox";
          const comparison = "Look, The Quick Brown Fox is here";

          const result = await executeTool(
            plagiarismHighlighter,
            {
              source,
              comparison,
            },
            { caseSensitive: true, minMatchLength: 10 }
          );

          expect(result.success).toBe(true);
          if (result.success) {
            const data = result.data as Record<string, unknown>;
            const matches = data.matches as Record<string, unknown>[];
            expect(matches.length).toBeGreaterThan(0);
            // The match should preserve exact case
            const matchText = matches[0]?.text as string;
            expect(matchText).toContain("Quick Brown");
          }
        });
      });
    });

    describe("multiple matches", () => {
      it("should find multiple distinct matches", async () => {
        const source =
          "First common phrase here. Some unique text. Second common phrase here.";
        const comparison =
          "Different start. First common phrase here. Middle part. Second common phrase here. Different end.";

        const result = await executeTool(plagiarismHighlighter, {
          source,
          comparison,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const matches = (result.data as Record<string, unknown>)
            .matches as Record<string, unknown>[];
          expect(matches.length).toBeGreaterThanOrEqual(2);
        }
      });

      it("should not overlap matches", async () => {
        const source = "AAAAA BBBBB CCCCC DDDDD EEEEE";
        const comparison = "AAAAA BBBBB CCCCC DDDDD EEEEE";

        const result = await executeTool(
          plagiarismHighlighter,
          {
            source,
            comparison,
          },
          { minMatchLength: 5 }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const matches = data.matches as Record<string, unknown>[];
          // Check that matches don't overlap in source
          const sortedMatches = [...matches].sort(
            (a, b) => (a.sourceStart as number) - (b.sourceStart as number)
          );
          for (let i = 1; i < sortedMatches.length; i++) {
            const prev = sortedMatches[i - 1];
            const curr = sortedMatches[i];
            if (prev && curr) {
              expect(curr.sourceStart as number).toBeGreaterThanOrEqual(
                prev.sourceEnd as number
              );
            }
          }
        }
      });
    });

    describe("edge cases", () => {
      it("should handle empty source", async () => {
        const result = await executeTool(plagiarismHighlighter, {
          source: "",
          comparison: "Some text here",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const matches = data.matches as Record<string, unknown>[];
          expect(matches.length).toBe(0);
          expect(data.similarityScore).toBe(0);
          expect(data.highlightedSource).toBe("");
        }
      });

      it("should handle empty comparison", async () => {
        const result = await executeTool(plagiarismHighlighter, {
          source: "Some text here",
          comparison: "",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const matches = data.matches as Record<string, unknown>[];
          expect(matches.length).toBe(0);
          expect(data.similarityScore).toBe(0);
          expect(data.highlightedComparison).toBe("");
        }
      });

      it("should handle both empty", async () => {
        const result = await executeTool(plagiarismHighlighter, {
          source: "",
          comparison: "",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const matches = data.matches as Record<string, unknown>[];
          expect(matches.length).toBe(0);
          expect(data.similarityScore).toBe(100); // Both empty = identical
        }
      });

      it("should handle text shorter than minMatchLength", async () => {
        const result = await executeTool(
          plagiarismHighlighter,
          {
            source: "short",
            comparison: "short",
          },
          { minMatchLength: 20 }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const matches = (result.data as Record<string, unknown>)
            .matches as Record<string, unknown>[];
          expect(matches.length).toBe(0);
        }
      });

      it("should handle special characters", async () => {
        const source =
          "Text with special chars: @#$%^&*() and unicode: \u00e9\u00e8\u00ea";
        const comparison =
          "Other text with special chars: @#$%^&*() and unicode: \u00e9\u00e8\u00ea here";

        const result = await executeTool(
          plagiarismHighlighter,
          {
            source,
            comparison,
          },
          { minMatchLength: 10 }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const matches = (result.data as Record<string, unknown>)
            .matches as Record<string, unknown>[];
          expect(matches.length).toBeGreaterThan(0);
        }
      });

      it("should handle whitespace variations", async () => {
        const source = "The   quick    brown     fox";
        const comparison = "The quick brown fox";

        const result = await executeTool(
          plagiarismHighlighter,
          {
            source,
            comparison,
          },
          { minMatchLength: 5 }
        );

        expect(result.success).toBe(true);
        // Whitespace differences should result in partial matches
      });

      it("should handle very long texts", async () => {
        const base = "This is a repeating sentence. ";
        const source = base.repeat(50);
        const comparison = base.repeat(50);

        const result = await executeTool(plagiarismHighlighter, {
          source,
          comparison,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).similarityScore).toBe(
            100
          );
        }
      });

      it("should handle newlines and line breaks", async () => {
        const source = "Line one\nLine two\nLine three";
        const comparison = "Different\nLine one\nLine two\nLine three\nEnd";

        const result = await executeTool(
          plagiarismHighlighter,
          {
            source,
            comparison,
          },
          { minMatchLength: 10 }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const matches = (result.data as Record<string, unknown>)
            .matches as Record<string, unknown>[];
          expect(matches.length).toBeGreaterThan(0);
        }
      });
    });

    describe("real-world scenarios", () => {
      it("should detect plagiarized paragraphs", async () => {
        const source = `The theory of relativity is a foundational concept in modern physics.
          It was developed by Albert Einstein in the early 20th century.
          The theory fundamentally changed our understanding of space and time.`;

        const comparison = `In my essay about physics, I will discuss relativity.
          The theory of relativity is a foundational concept in modern physics.
          It was developed by Albert Einstein in the early 20th century.
          I believe this is very important.`;

        const result = await executeTool(plagiarismHighlighter, {
          source,
          comparison,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const matches = data.matches as Record<string, unknown>[];
          expect(matches.length).toBeGreaterThan(0);
          expect(data.similarityScore as number).toBeGreaterThan(30);
        }
      });

      it("should detect partial sentence matches", async () => {
        const source =
          "Machine learning algorithms can process vast amounts of data efficiently.";
        const comparison =
          "Today, machine learning algorithms can process vast amounts of data for various applications.";

        const result = await executeTool(plagiarismHighlighter, {
          source,
          comparison,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const matches = (result.data as Record<string, unknown>)
            .matches as Record<string, unknown>[];
          expect(matches.length).toBeGreaterThan(0);
        }
      });
    });
  });
});
