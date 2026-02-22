import { describe, it, expect } from "vitest";
import { teamsFormatter } from "../../../src/tools/communication/teams-formatter";

interface AdaptiveCardBody {
  type: string;
  text: string;
  weight: string;
  size: string;
  wrap: boolean;
  separator: boolean;
}

interface AdaptiveCard {
  type: string;
  version: string;
  $schema: string;
  body: AdaptiveCardBody[];
}

describe("teams-formatter", () => {
  const execute = (input: string, options?: Record<string, unknown>): string =>
    (teamsFormatter.execute({ input }, options as never) as { output: string })
      .output;

  describe("markdown format (default)", () => {
    it("converts <b> to bold markdown", () => {
      expect(execute("<b>bold</b>")).toBe("**bold**");
    });

    it("converts <strong> to bold markdown", () => {
      expect(execute("<strong>bold</strong>")).toBe("**bold**");
    });

    it("converts <i> to italic markdown", () => {
      expect(execute("<i>italic</i>")).toBe("_italic_");
    });

    it("converts <em> to italic markdown", () => {
      expect(execute("<em>italic</em>")).toBe("_italic_");
    });

    it("converts <s> to strikethrough markdown", () => {
      expect(execute("<s>deleted</s>")).toBe("~~deleted~~");
    });

    it("converts <del> to strikethrough markdown", () => {
      expect(execute("<del>deleted</del>")).toBe("~~deleted~~");
    });

    it("converts <a> to markdown link", () => {
      expect(execute('<a href="https://example.com">Link</a>')).toBe(
        "[Link](https://example.com)"
      );
    });

    it("converts <br> to newlines", () => {
      expect(execute("line1<br>line2")).toBe("line1\nline2");
      expect(execute("line1<br/>line2")).toBe("line1\nline2");
    });

    it("passes through plain markdown unchanged", () => {
      expect(execute("**bold** and _italic_")).toBe("**bold** and _italic_");
    });
  });

  describe("adaptive-card format", () => {
    const executeCard = (input: string): AdaptiveCard => {
      const output = execute(input, {
        format: "adaptive-card",
        // no other keys needed since defaults fill in
      } as never);
      return JSON.parse(output) as AdaptiveCard;
    };

    it("generates valid adaptive card structure", () => {
      const card = executeCard("Hello");
      expect(card.type).toBe("AdaptiveCard");
      expect(card.version).toBe("1.5");
      expect(card.$schema).toContain("adaptivecards.io");
    });

    it("converts h1 to ExtraLarge TextBlock", () => {
      const card = executeCard("# Title");
      expect(card.body[0].weight).toBe("Bolder");
      expect(card.body[0].size).toBe("ExtraLarge");
      expect(card.body[0].text).toBe("Title");
    });

    it("converts h2 to Large TextBlock", () => {
      const card = executeCard("## Subtitle");
      expect(card.body[0].weight).toBe("Bolder");
      expect(card.body[0].size).toBe("Large");
    });

    it("converts h3 to Medium TextBlock", () => {
      const card = executeCard("### Section");
      expect(card.body[0].weight).toBe("Bolder");
      expect(card.body[0].size).toBe("Medium");
    });

    it("converts --- to separator", () => {
      const card = executeCard("Above\n\n---\n\nBelow");
      const separatorBlock = card.body.find(
        (b: AdaptiveCardBody) => b.separator === true
      );
      expect(separatorBlock).toBeDefined();
    });

    it("groups regular lines into TextBlocks", () => {
      const card = executeCard("Line 1\nLine 2");
      expect(card.body[0].text).toBe("Line 1\nLine 2");
      expect(card.body[0].wrap).toBe(true);
    });

    it("separates blocks on empty lines", () => {
      const card = executeCard("Block 1\n\nBlock 2");
      expect(card.body).toHaveLength(2);
      expect(card.body[0].text).toBe("Block 1");
      expect(card.body[1].text).toBe("Block 2");
    });
  });

  it("throws on empty input", () => {
    expect(() => teamsFormatter.execute({ input: "" })).toThrow(
      "Input cannot be empty"
    );
  });

  it("throws on whitespace-only input", () => {
    expect(() => teamsFormatter.execute({ input: "   " })).toThrow(
      "Input cannot be empty"
    );
  });
});
