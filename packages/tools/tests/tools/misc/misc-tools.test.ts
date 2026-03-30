import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import {
  stringLength,
  stringObfuscator,
  characterRepeater,
  pigLatin,
  leetSpeak,
  emojiConverter,
  zalgoText,
  upsideDownText,
  fancyText,
  mimeTypeReference,
  htmlEntityReference,
} from "../../../src/tools/misc";

// =====================================================
// String Length
// =====================================================
describe("String Length", () => {
  it("should have correct metadata", () => {
    expect(stringLength.meta.id).toBe("misc/string-length");
    expect(stringLength.meta.category).toBe("misc");
  });

  it("should measure basic ASCII string", async () => {
    const result = await executeTool(stringLength, { input: "hello" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).characters).toBe(5);
      expect((result.data as Record<string, unknown>).codePoints).toBe(5);
      expect((result.data as Record<string, unknown>).words).toBe(1);
      expect((result.data as Record<string, unknown>).lines).toBe(1);
    }
  });

  it("should handle empty string", async () => {
    const result = await executeTool(stringLength, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).characters).toBe(0);
      expect((result.data as Record<string, unknown>).words).toBe(0);
    }
  });

  it("should handle multiline text", async () => {
    const result = await executeTool(stringLength, {
      input: "line1\nline2\nline3",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).lines).toBe(3);
    }
  });
});

// =====================================================
// String Obfuscator
// =====================================================
describe("String Obfuscator", () => {
  it("should have correct metadata", () => {
    expect(stringObfuscator.meta.id).toBe("misc/string-obfuscator");
    expect(stringObfuscator.meta.category).toBe("misc");
  });

  it("should obfuscate text with homoglyphs", async () => {
    const result = await executeTool(stringObfuscator, { input: "hello" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBeDefined();
      expect((result.data as Record<string, unknown>).output).not.toBe("hello");
    }
  });
});

// =====================================================
// Character Repeater
// =====================================================
describe("Character Repeater", () => {
  it("should have correct metadata", () => {
    expect(characterRepeater.meta.id).toBe("misc/character-repeater");
    expect(characterRepeater.meta.category).toBe("misc");
  });

  it("should repeat string with defaults", async () => {
    const result = await executeTool(characterRepeater, { input: "abc" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBe("abcabcabc");
    }
  });

  it("should repeat with custom separator", async () => {
    const result = await executeTool(
      characterRepeater,
      { input: "hi" },
      { count: 2, separator: "-" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBe("hi-hi");
    }
  });
});

// =====================================================
// Pig Latin
// =====================================================
describe("Pig Latin", () => {
  it("should have correct metadata", () => {
    expect(pigLatin.meta.id).toBe("misc/pig-latin");
    expect(pigLatin.meta.category).toBe("misc");
  });

  it("should convert text to Pig Latin", async () => {
    const result = await executeTool(pigLatin, { input: "hello" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("ello");
    }
  });

  it("should handle vowel-starting words", async () => {
    const result = await executeTool(pigLatin, { input: "apple" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "appleyay"
      );
    }
  });

  it("should preserve all-caps words as all-caps", async () => {
    const result = await executeTool(pigLatin, { input: "HELLO WORLD" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBe(
        "ELLOHAY ORLDWAY"
      );
    }
  });
});

// =====================================================
// Leet Speak
// =====================================================
describe("Leet Speak", () => {
  it("should have correct metadata", () => {
    expect(leetSpeak.meta.id).toBe("misc/leet-speak");
    expect(leetSpeak.meta.category).toBe("misc");
  });

  it("should convert to leet speak", async () => {
    const result = await executeTool(leetSpeak, { input: "elite" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBe("31173");
    }
  });

  it("should throw on empty input", async () => {
    const result = await executeTool(leetSpeak, { input: "" });
    expect(result.success).toBe(false);
  });
});

// =====================================================
// Emoji Converter
// =====================================================
describe("Emoji Converter", () => {
  it("should have correct metadata", () => {
    expect(emojiConverter.meta.id).toBe("misc/emoji-converter");
    expect(emojiConverter.meta.category).toBe("misc");
  });

  it("should convert known words to emoji", async () => {
    const result = await executeTool(emojiConverter, { input: "I love this" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBeDefined();
    }
  });
});

// =====================================================
// Zalgo Text
// =====================================================
describe("Zalgo Text", () => {
  it("should have correct metadata", () => {
    expect(zalgoText.meta.id).toBe("misc/zalgo-text");
    expect(zalgoText.meta.category).toBe("misc");
  });

  it("should zalgofy text", async () => {
    const result = await executeTool(zalgoText, { input: "hello" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        (result.data as Record<string, unknown>).output.length
      ).toBeGreaterThan(5);
    }
  });
});

// =====================================================
// Upside Down Text
// =====================================================
describe("Upside Down Text", () => {
  it("should have correct metadata", () => {
    expect(upsideDownText.meta.id).toBe("misc/upside-down-text");
    expect(upsideDownText.meta.category).toBe("misc");
  });

  it("should flip text upside down", async () => {
    const result = await executeTool(upsideDownText, { input: "hello" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBeDefined();
      expect((result.data as Record<string, unknown>).output).not.toBe("hello");
    }
  });
});

// =====================================================
// Fancy Text
// =====================================================
describe("Fancy Text", () => {
  it("should have correct metadata", () => {
    expect(fancyText.meta.id).toBe("misc/fancy-text");
    expect(fancyText.meta.category).toBe("misc");
  });

  it("should stylize text with bold Unicode", async () => {
    const result = await executeTool(
      fancyText,
      { input: "hello" },
      { style: "bold" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBeDefined();
      expect((result.data as Record<string, unknown>).output).not.toBe("hello");
    }
  });
});

// =====================================================
// Reference Tools
// =====================================================
describe("MIME Type Reference", () => {
  it("should have correct metadata", () => {
    expect(mimeTypeReference.meta.id).toBe("misc/mime-type-reference");
    expect(mimeTypeReference.meta.category).toBe("misc");
  });

  it("should return MIME types reference", async () => {
    const result = await executeTool(mimeTypeReference, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "text/html"
      );
    }
  });
});

describe("HTML Entity Reference", () => {
  it("should have correct metadata", () => {
    expect(htmlEntityReference.meta.id).toBe("misc/html-entity-reference");
    expect(htmlEntityReference.meta.category).toBe("misc");
  });

  it("should return HTML entities", async () => {
    const result = await executeTool(htmlEntityReference, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "&amp;"
      );
    }
  });
});
