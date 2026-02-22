import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import {
  htmlFormatter,
  htmlMinify,
  htmlValidator,
  htmlToText,
  htmlEntityEncoder,
  htmlEntityDecoder,
  htmlAttributeRemover,
  htmlPlayground,
  htmlTableGenerator,
  htmlListGenerator,
  faviconGenerator,
} from "../../../src/tools/html";

// ─── HTML Formatter ────────────────────────────────────────────────────────────

describe("HTML Formatter", () => {
  it("should have correct metadata", () => {
    expect(htmlFormatter.meta.id).toBe("html/formatter");
    expect(htmlFormatter.meta.category).toBe("html");
  });

  it("should format inline HTML with proper indentation", async () => {
    const result = await executeTool(htmlFormatter, {
      input: "<div><p>Hello</p></div>",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "<div>"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "  <p>"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "    Hello"
      );
    }
  });

  it("should handle self-closing tags", async () => {
    const result = await executeTool(htmlFormatter, {
      input: "<div><img src='x.png'><br></div>",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      // img and br are void elements; should not increase indent
      expect((result.data as Record<string, unknown>).output).toContain("<img");
      expect((result.data as Record<string, unknown>).output).toContain("<br>");
    }
  });

  it("should handle doctype and comments", async () => {
    const result = await executeTool(htmlFormatter, {
      input: "<!DOCTYPE html><!-- comment --><html><body></body></html>",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "<!DOCTYPE html>"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "<!-- comment -->"
      );
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(htmlFormatter, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should respect custom indent option", async () => {
    const result = await executeTool(
      htmlFormatter,
      { input: "<div><p>Hello</p></div>" },
      { indent: 4 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "    <p>"
      );
    }
  });
});

// ─── HTML Minify ───────────────────────────────────────────────────────────────

describe("HTML Minify", () => {
  it("should have correct metadata", () => {
    expect(htmlMinify.meta.id).toBe("html/minify");
    expect(htmlMinify.meta.category).toBe("html");
  });

  it("should minify HTML with whitespace", async () => {
    const result = await executeTool(htmlMinify, {
      input: "<div>\n  <p>Hello</p>\n</div>",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBe(
        "<div><p>Hello</p></div>"
      );
      expect(
        (result.data as Record<string, unknown>).reduction
      ).toBeGreaterThan(0);
    }
  });

  it("should remove HTML comments", async () => {
    const result = await executeTool(htmlMinify, {
      input: "<!-- comment --><div>Hello</div>",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).not.toContain(
        "comment"
      );
    }
  });

  it("should preserve pre tag content", async () => {
    const result = await executeTool(htmlMinify, {
      input: "<div>  text  </div><pre>  preserved  </pre>",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "  preserved  "
      );
    }
  });

  it("should track size reduction", async () => {
    const result = await executeTool(htmlMinify, {
      input: "<div>   \n\n  Hello World   \n\n   </div>",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        (result.data as Record<string, unknown>).originalSize
      ).toBeGreaterThan((result.data as Record<string, unknown>).minifiedSize);
      expect(
        (result.data as Record<string, unknown>).reduction
      ).toBeGreaterThan(0);
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(htmlMinify, { input: "" });
    expect(result.success).toBe(false);
  });
});

// ─── HTML Validator ────────────────────────────────────────────────────────────

describe("HTML Validator", () => {
  it("should have correct metadata", () => {
    expect(htmlValidator.meta.id).toBe("html/validator");
    expect(htmlValidator.meta.category).toBe("html");
  });

  it("should validate correct HTML", async () => {
    const result = await executeTool(htmlValidator, {
      input: "<div><p>Hello</p></div>",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).valid).toBe(true);
      expect((result.data as Record<string, unknown>).errors.length).toBe(0);
    }
  });

  it("should detect unclosed tags", async () => {
    const result = await executeTool(htmlValidator, {
      input: "<div><p>Hello</div>",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).valid).toBe(false);
      expect(
        (result.data as Record<string, unknown>).errors.length
      ).toBeGreaterThan(0);
    }
  });

  it("should detect unexpected closing tags", async () => {
    const result = await executeTool(htmlValidator, {
      input: "</div>",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).valid).toBe(false);
    }
  });

  it("should warn about missing alt on img", async () => {
    const result = await executeTool(htmlValidator, {
      input: '<img src="test.png">',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        (result.data as Record<string, unknown>).warnings.length
      ).toBeGreaterThan(0);
      expect((result.data as Record<string, unknown>).warnings[0]).toContain(
        "alt"
      );
    }
  });

  it("should handle void elements correctly", async () => {
    const result = await executeTool(htmlValidator, {
      input: "<br><hr><img src='x.png' alt='test'>",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).valid).toBe(true);
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(htmlValidator, { input: "" });
    expect(result.success).toBe(false);
  });
});

// ─── HTML to Text ──────────────────────────────────────────────────────────────

describe("HTML to Text", () => {
  it("should have correct metadata", () => {
    expect(htmlToText.meta.id).toBe("html/to-text");
    expect(htmlToText.meta.category).toBe("html");
  });

  it("should strip tags and extract text", async () => {
    const result = await executeTool(htmlToText, {
      input: "<div><p>Hello <strong>World</strong></p></div>",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Hello"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "World"
      );
      expect((result.data as Record<string, unknown>).output).not.toContain(
        "<"
      );
    }
  });

  it("should remove script and style content", async () => {
    const result = await executeTool(htmlToText, {
      input: "<div>Hello</div><script>var x=1;</script><style>.x{}</style>",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Hello"
      );
      expect((result.data as Record<string, unknown>).output).not.toContain(
        "var x"
      );
      expect((result.data as Record<string, unknown>).output).not.toContain(
        ".x"
      );
    }
  });

  it("should decode HTML entities", async () => {
    const result = await executeTool(htmlToText, {
      input: "<p>&amp; &quot; &nbsp;</p>",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("&");
      expect((result.data as Record<string, unknown>).output).toContain('"');
    }
  });

  it("should preserve link URLs when option is set", async () => {
    const result = await executeTool(
      htmlToText,
      { input: '<a href="https://example.com">Click here</a>' },
      { preserveLinks: true }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "[Click here](https://example.com)"
      );
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(htmlToText, { input: "" });
    expect(result.success).toBe(false);
  });
});

// ─── HTML Entity Encoder ───────────────────────────────────────────────────────

describe("HTML Entity Encoder", () => {
  it("should have correct metadata", () => {
    expect(htmlEntityEncoder.meta.id).toBe("html/entity-encoder");
    expect(htmlEntityEncoder.meta.category).toBe("html");
  });

  it("should encode special characters with named entities", async () => {
    const result = await executeTool(htmlEntityEncoder, {
      input: '& < > "',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "&amp;"
      );
      expect((result.data as Record<string, unknown>).output).toContain("&lt;");
      expect((result.data as Record<string, unknown>).output).toContain("&gt;");
      expect((result.data as Record<string, unknown>).output).toContain(
        "&quot;"
      );
    }
  });

  it("should encode with numeric mode", async () => {
    const result = await executeTool(
      htmlEntityEncoder,
      { input: "& < >" },
      { mode: "numeric" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "&#38;"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "&#60;"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "&#62;"
      );
    }
  });

  it("should encode with hex mode", async () => {
    const result = await executeTool(
      htmlEntityEncoder,
      { input: "&" },
      { mode: "hex" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "&#x26;"
      );
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(htmlEntityEncoder, { input: "" });
    expect(result.success).toBe(false);
  });
});

// ─── HTML Entity Decoder ───────────────────────────────────────────────────────

describe("HTML Entity Decoder", () => {
  it("should have correct metadata", () => {
    expect(htmlEntityDecoder.meta.id).toBe("html/entity-decoder");
    expect(htmlEntityDecoder.meta.category).toBe("html");
  });

  it("should decode named entities", async () => {
    const result = await executeTool(htmlEntityDecoder, {
      input: "&amp; &lt; &gt; &quot;",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBe('& < > "');
    }
  });

  it("should decode numeric entities", async () => {
    const result = await executeTool(htmlEntityDecoder, {
      input: "&#38; &#60; &#62;",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBe("& < >");
    }
  });

  it("should decode hex entities", async () => {
    const result = await executeTool(htmlEntityDecoder, {
      input: "&#x26; &#x3C; &#x3E;",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBe("& < >");
    }
  });

  it("should decode special named entities", async () => {
    const result = await executeTool(htmlEntityDecoder, {
      input: "&copy; &reg; &trade;",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "\u00a9"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "\u00ae"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "\u2122"
      );
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(htmlEntityDecoder, { input: "" });
    expect(result.success).toBe(false);
  });
});

// ─── HTML Attribute Remover ────────────────────────────────────────────────────

describe("HTML Attribute Remover", () => {
  it("should have correct metadata", () => {
    expect(htmlAttributeRemover.meta.id).toBe("html/attribute-remover");
    expect(htmlAttributeRemover.meta.category).toBe("html");
  });

  it("should remove style, onclick, onload by default", async () => {
    const result = await executeTool(htmlAttributeRemover, {
      input:
        '<div style="color:red" onclick="alert(1)" class="test">Hello</div>',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).not.toContain(
        "style="
      );
      expect((result.data as Record<string, unknown>).output).not.toContain(
        "onclick="
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        'class="test"'
      );
      expect(
        (result.data as Record<string, unknown>).attributesRemoved
      ).toBeGreaterThan(0);
    }
  });

  it("should remove all event attributes when option is set", async () => {
    const result = await executeTool(
      htmlAttributeRemover,
      { input: '<div onmouseover="x()" onfocus="y()">Hello</div>' },
      { attributes: "", removeAllEvents: true }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).not.toContain(
        "onmouseover"
      );
      expect((result.data as Record<string, unknown>).output).not.toContain(
        "onfocus"
      );
    }
  });

  it("should remove all data-* attributes when option is set", async () => {
    const result = await executeTool(
      htmlAttributeRemover,
      { input: '<div data-id="123" data-name="test">Hello</div>' },
      { attributes: "", removeAllData: true }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).not.toContain(
        "data-id"
      );
      expect((result.data as Record<string, unknown>).output).not.toContain(
        "data-name"
      );
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(htmlAttributeRemover, { input: "" });
    expect(result.success).toBe(false);
  });
});

// ─── HTML Playground ───────────────────────────────────────────────────────────

describe("HTML Playground", () => {
  it("should have correct metadata", () => {
    expect(htmlPlayground.meta.id).toBe("html/playground");
    expect(htmlPlayground.meta.category).toBe("html");
  });

  it("should build a full HTML document from fragment", async () => {
    const result = await executeTool(htmlPlayground, {
      input: "<p>Hello World</p>",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "<!DOCTYPE html>"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "<html>"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "<body>"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "<p>Hello World</p>"
      );
    }
  });

  it("should inject additional CSS and JS", async () => {
    const result = await executeTool(
      htmlPlayground,
      { input: "<p>Hello</p>" },
      { css: "p { color: red; }", js: "console.log('hi')" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "p { color: red; }"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "console.log('hi')"
      );
    }
  });

  it("should extract style tags from input body", async () => {
    const result = await executeTool(htmlPlayground, {
      input: "<style>body{color:red}</style><p>Hello</p>",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "<style>body{color:red}</style>"
      );
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(htmlPlayground, { input: "" });
    expect(result.success).toBe(false);
  });
});

// ─── HTML Table Generator ──────────────────────────────────────────────────────

describe("HTML Table Generator", () => {
  it("should have correct metadata", () => {
    expect(htmlTableGenerator.meta.id).toBe("html/table-generator");
    expect(htmlTableGenerator.meta.category).toBe("html");
  });

  it("should generate table with defaults", async () => {
    const result = await executeTool(htmlTableGenerator, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "<table"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "<thead>"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "<tbody>"
      );
      expect((result.data as Record<string, unknown>).output).toContain("<th");
      expect((result.data as Record<string, unknown>).output).toContain("<td");
      expect((result.data as Record<string, unknown>).output).toContain(
        "Header 1"
      );
    }
  });

  it("should use custom headers", async () => {
    const result = await executeTool(htmlTableGenerator, {
      rows: 2,
      columns: 2,
      headers: "Name,Age",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("Name");
      expect((result.data as Record<string, unknown>).output).toContain("Age");
    }
  });

  it("should generate striped rows", async () => {
    const result = await executeTool(htmlTableGenerator, {
      rows: 4,
      columns: 2,
      striped: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "background-color: #f9f9f9"
      );
    }
  });

  it("should use custom data", async () => {
    const result = await executeTool(htmlTableGenerator, {
      rows: 2,
      columns: 2,
      data: "Alice,30\nBob,25",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Alice"
      );
      expect((result.data as Record<string, unknown>).output).toContain("30");
      expect((result.data as Record<string, unknown>).output).toContain("Bob");
    }
  });
});

// ─── HTML List Generator ───────────────────────────────────────────────────────

describe("HTML List Generator", () => {
  it("should have correct metadata", () => {
    expect(htmlListGenerator.meta.id).toBe("html/list-generator");
    expect(htmlListGenerator.meta.category).toBe("html");
  });

  it("should generate unordered list with defaults", async () => {
    const result = await executeTool(htmlListGenerator, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<ul>");
      expect((result.data as Record<string, unknown>).output).toContain("<li>");
      expect((result.data as Record<string, unknown>).output).toContain(
        "</ul>"
      );
    }
  });

  it("should generate ordered list", async () => {
    const result = await executeTool(htmlListGenerator, {
      type: "ol",
      items: "First\nSecond\nThird",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<ol>");
      expect((result.data as Record<string, unknown>).output).toContain(
        "First"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Second"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Third"
      );
    }
  });

  it("should apply list style", async () => {
    const result = await executeTool(htmlListGenerator, {
      items: "A\nB",
      listStyle: "square",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "list-style-type: square"
      );
    }
  });

  it("should apply className", async () => {
    const result = await executeTool(htmlListGenerator, {
      items: "A\nB",
      className: "my-list",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        'class="my-list"'
      );
    }
  });
});

// ─── Favicon Generator ─────────────────────────────────────────────────────────

describe("Favicon Generator", () => {
  it("should have correct metadata", () => {
    expect(faviconGenerator.meta.id).toBe("html/favicon-generator");
    expect(faviconGenerator.meta.category).toBe("html");
  });

  it("should generate SVG favicon with defaults", async () => {
    const result = await executeTool(faviconGenerator, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
      expect((result.data as Record<string, unknown>).output).toContain(
        "</svg>"
      );
      expect((result.data as Record<string, unknown>).output).toContain("A"); // default text
      expect((result.data as Record<string, unknown>).linkTag).toContain(
        '<link rel="icon"'
      );
      expect((result.data as Record<string, unknown>).linkTag).toContain(
        "data:image/svg+xml,"
      );
    }
  });

  it("should generate circular favicon", async () => {
    const result = await executeTool(faviconGenerator, {
      text: "X",
      shape: "circle",
      backgroundColor: "#ff0000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "<circle"
      );
      expect((result.data as Record<string, unknown>).output).toContain("X");
      expect((result.data as Record<string, unknown>).output).toContain(
        "#ff0000"
      );
    }
  });

  it("should generate square favicon", async () => {
    const result = await executeTool(faviconGenerator, {
      text: "B",
      shape: "square",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "<rect"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        'rx="0"'
      );
    }
  });

  it("should respect custom size and font size", async () => {
    const result = await executeTool(faviconGenerator, {
      size: 128,
      fontSize: 48,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        'width="128"'
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        'height="128"'
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        'font-size="48"'
      );
    }
  });
});
