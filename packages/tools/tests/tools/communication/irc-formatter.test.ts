import { describe, it, expect } from "vitest";
import { ircFormatter } from "../../../src/tools/communication/irc-formatter";

describe("irc-formatter", () => {
  const execute = (input: string, options?: Record<string, unknown>): string =>
    (ircFormatter.execute({ input }, options as never) as { output: string })
      .output;

  it("returns plain text with default options", () => {
    const output = execute("Hello world");
    expect(output).toContain("Raw (copy this):\nHello world");
    expect(output).toContain("Readable:\nHello world");
  });

  it("converts markdown bold to IRC bold", () => {
    const output = execute("**bold text**");
    expect(output).toContain("[BOLD]bold text[BOLD]");
    expect(output).toContain("\x02bold text\x02");
  });

  it("converts markdown italic (*) to IRC italic", () => {
    const output = execute("*italic text*");
    expect(output).toContain("[ITALIC]italic text[ITALIC]");
  });

  it("converts markdown italic (_) to IRC italic", () => {
    const output = execute("_italic text_");
    expect(output).toContain("[ITALIC]italic text[ITALIC]");
  });

  it("converts markdown underline (__) to IRC underline", () => {
    const output = execute("__underlined__");
    expect(output).toContain("[UNDERLINE]underlined[UNDERLINE]");
  });

  it("applies color option", () => {
    const output = execute("colored", {
      color: "red",
      background: "none",
      bold: false,
      italic: false,
      underline: false,
    });
    expect(output).toContain("[COLOR:04]colored[/COLOR]");
  });

  it("applies background color", () => {
    const output = execute("highlighted", {
      color: "white",
      background: "blue",
      bold: false,
      italic: false,
      underline: false,
    });
    expect(output).toContain("[COLOR:00,02]highlighted[/COLOR]");
  });

  it("applies bold option", () => {
    const output = execute("bold", {
      color: "white",
      background: "none",
      bold: true,
      italic: false,
      underline: false,
    });
    expect(output).toContain("[BOLD]bold[BOLD]");
  });

  it("applies italic option", () => {
    const output = execute("italic", {
      color: "white",
      background: "none",
      bold: false,
      italic: true,
      underline: false,
    });
    expect(output).toContain("[ITALIC]italic[ITALIC]");
  });

  it("applies underline option", () => {
    const output = execute("underline", {
      color: "white",
      background: "none",
      bold: false,
      italic: false,
      underline: true,
    });
    expect(output).toContain("[UNDERLINE]underline[UNDERLINE]");
  });

  it("combines multiple formatting options", () => {
    const output = execute("text", {
      color: "green",
      background: "none",
      bold: true,
      italic: true,
      underline: false,
    });
    expect(output).toContain("[BOLD]");
    expect(output).toContain("[ITALIC]");
    expect(output).toContain("[COLOR:03]");
  });

  it("throws on empty input", () => {
    expect(() => ircFormatter.execute({ input: "" })).toThrow(
      "Input cannot be empty"
    );
  });

  it("throws on whitespace-only input", () => {
    expect(() => ircFormatter.execute({ input: "   " })).toThrow(
      "Input cannot be empty"
    );
  });
});
