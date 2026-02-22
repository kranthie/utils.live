import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import {
  cssFormatter,
  cssMinify,
  cssValidator,
  scssToCss,
  lessToCss,
  cssToScss,
  cssSpecificity,
  cssGradientGenerator,
  cssBoxShadow,
  cssBorderRadius,
  cssFlexboxGenerator,
  cssGridGenerator,
} from "../../../src/tools/css";

// ─── CSS Formatter ─────────────────────────────────────────────────────────────

describe("CSS Formatter", () => {
  it("should have correct metadata", () => {
    expect(cssFormatter.meta.id).toBe("css/formatter");
    expect(cssFormatter.meta.category).toBe("css");
  });

  it("should format minified CSS", async () => {
    const result = await executeTool(cssFormatter, {
      input: "body{color:red;margin:0}",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "body {"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "color:"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "margin:"
      );
    }
  });

  it("should handle multiple selectors", async () => {
    const result = await executeTool(cssFormatter, {
      input: "h1{font-size:24px}p{color:blue}",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("h1 {");
      expect((result.data as Record<string, unknown>).output).toContain("p {");
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(cssFormatter, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should respect custom indent option", async () => {
    const result = await executeTool(
      cssFormatter,
      { input: "body{color:red}" },
      { indent: 4 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "    color:"
      );
    }
  });
});

// ─── CSS Minify ────────────────────────────────────────────────────────────────

describe("CSS Minify", () => {
  it("should have correct metadata", () => {
    expect(cssMinify.meta.id).toBe("css/minify");
    expect(cssMinify.meta.category).toBe("css");
  });

  it("should minify CSS with whitespace", async () => {
    const result = await executeTool(cssMinify, {
      input: "body {\n  color: red;\n  margin: 0;\n}",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBe(
        "body{color:red;margin:0}"
      );
      expect(
        (result.data as Record<string, unknown>).reduction
      ).toBeGreaterThan(0);
      expect(
        (result.data as Record<string, unknown>).originalSize
      ).toBeGreaterThan((result.data as Record<string, unknown>).minifiedSize);
    }
  });

  it("should remove comments", async () => {
    const result = await executeTool(cssMinify, {
      input: "/* comment */\nbody { color: red; }",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).not.toContain(
        "comment"
      );
    }
  });

  it("should remove trailing semicolons before closing braces", async () => {
    const result = await executeTool(cssMinify, {
      input: "body { color: red; }",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).not.toContain(
        ";}"
      );
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(cssMinify, { input: "" });
    expect(result.success).toBe(false);
  });
});

// ─── CSS Validator ─────────────────────────────────────────────────────────────

describe("CSS Validator", () => {
  it("should have correct metadata", () => {
    expect(cssValidator.meta.id).toBe("css/validator");
    expect(cssValidator.meta.category).toBe("css");
  });

  it("should validate correct CSS", async () => {
    const result = await executeTool(cssValidator, {
      input: "body { color: red; margin: 0; }",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).valid).toBe(true);
      expect((result.data as Record<string, unknown>).errors.length).toBe(0);
      expect((result.data as Record<string, unknown>).stats.rules).toBe(1);
      expect((result.data as Record<string, unknown>).stats.properties).toBe(2);
    }
  });

  it("should detect unmatched braces", async () => {
    const result = await executeTool(cssValidator, {
      input: "body { color: red;",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).valid).toBe(false);
      expect(
        (result.data as Record<string, unknown>).errors.length
      ).toBeGreaterThan(0);
    }
  });

  it("should warn about !important usage", async () => {
    const result = await executeTool(cssValidator, {
      input: "body { color: red !important; }",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        (result.data as Record<string, unknown>).warnings.length
      ).toBeGreaterThan(0);
      expect((result.data as Record<string, unknown>).warnings[0]).toContain(
        "!important"
      );
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(cssValidator, { input: "" });
    expect(result.success).toBe(false);
  });
});

// ─── SCSS to CSS ───────────────────────────────────────────────────────────────

describe("SCSS to CSS", () => {
  it("should have correct metadata", () => {
    expect(scssToCss.meta.id).toBe("css/scss-to-css");
    expect(scssToCss.meta.category).toBe("css");
  });

  it("should resolve SCSS variables", async () => {
    const result = await executeTool(scssToCss, {
      input: "$primary: blue;\nbody { color: $primary; }",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "color: blue;"
      );
      expect((result.data as Record<string, unknown>).output).not.toContain(
        "$primary"
      );
    }
  });

  it("should flatten nested SCSS", async () => {
    const result = await executeTool(scssToCss, {
      input: ".parent {\n  color: red;\n  .child {\n    color: blue;\n  }\n}",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        ".parent {"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        ".parent .child {"
      );
    }
  });

  it("should handle & parent selector", async () => {
    const result = await executeTool(scssToCss, {
      input: "a {\n  color: blue;\n  &:hover {\n    color: red;\n  }\n}",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "a:hover {"
      );
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(scssToCss, { input: "" });
    expect(result.success).toBe(false);
  });
});

// ─── LESS to CSS ───────────────────────────────────────────────────────────────

describe("LESS to CSS", () => {
  it("should have correct metadata", () => {
    expect(lessToCss.meta.id).toBe("css/less-to-css");
    expect(lessToCss.meta.category).toBe("css");
  });

  it("should resolve LESS variables", async () => {
    const result = await executeTool(lessToCss, {
      input: "@primary: blue;\nbody { color: @primary; }",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "color: blue;"
      );
      expect((result.data as Record<string, unknown>).output).not.toContain(
        "@primary"
      );
    }
  });

  it("should flatten nested LESS", async () => {
    const result = await executeTool(lessToCss, {
      input: ".parent {\n  color: red;\n  .child {\n    color: blue;\n  }\n}",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        ".parent {"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        ".parent .child {"
      );
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(lessToCss, { input: "" });
    expect(result.success).toBe(false);
  });
});

// ─── CSS to SCSS ───────────────────────────────────────────────────────────────

describe("CSS to SCSS", () => {
  it("should have correct metadata", () => {
    expect(cssToScss.meta.id).toBe("css/css-to-scss");
    expect(cssToScss.meta.category).toBe("css");
  });

  it("should nest child selectors", async () => {
    const result = await executeTool(cssToScss, {
      input: ".parent { color: red; }\n.parent .child { color: blue; }",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        ".parent {"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        ".child {"
      );
    }
  });

  it("should handle single rule", async () => {
    const result = await executeTool(cssToScss, {
      input: "body { margin: 0; padding: 0; }",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "body {"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "margin: 0;"
      );
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(cssToScss, { input: "" });
    expect(result.success).toBe(false);
  });
});

// ─── CSS Specificity ───────────────────────────────────────────────────────────

describe("CSS Specificity Calculator", () => {
  it("should have correct metadata", () => {
    expect(cssSpecificity.meta.id).toBe("css/specificity");
    expect(cssSpecificity.meta.category).toBe("css");
  });

  it("should calculate specificity of simple element selector", async () => {
    const result = await executeTool(cssSpecificity, { input: "div" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "(0, 0, 1)"
      );
    }
  });

  it("should calculate specificity of ID selector", async () => {
    const result = await executeTool(cssSpecificity, { input: "#main" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "(1, 0, 0)"
      );
    }
  });

  it("should calculate specificity of class selector", async () => {
    const result = await executeTool(cssSpecificity, { input: ".container" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "(0, 1, 0)"
      );
    }
  });

  it("should calculate combined specificity", async () => {
    const result = await executeTool(cssSpecificity, {
      input: "#main .container div",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "(1, 1, 1)"
      );
    }
  });

  it("should sort multiple selectors by specificity", async () => {
    const result = await executeTool(cssSpecificity, {
      input: "div\n#main\n.container",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Sorted by specificity"
      );
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(cssSpecificity, { input: "" });
    expect(result.success).toBe(false);
  });
});

// ─── CSS Gradient Generator ────────────────────────────────────────────────────

describe("CSS Gradient Generator", () => {
  it("should have correct metadata", () => {
    expect(cssGradientGenerator.meta.id).toBe("css/gradient-generator");
    expect(cssGradientGenerator.meta.category).toBe("css");
  });

  it("should generate linear gradient with defaults", async () => {
    const result = await executeTool(cssGradientGenerator, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "linear-gradient(to right,"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        ".gradient {"
      );
    }
  });

  it("should generate radial gradient", async () => {
    const result = await executeTool(cssGradientGenerator, {
      type: "radial",
      colors: "#ff0000, #0000ff",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "radial-gradient("
      );
    }
  });

  it("should generate conic gradient", async () => {
    const result = await executeTool(cssGradientGenerator, {
      type: "conic",
      colors: "#ff0000, #00ff00, #0000ff",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "conic-gradient("
      );
    }
  });

  it("should generate repeating gradient", async () => {
    const result = await executeTool(cssGradientGenerator, {
      repeating: true,
      colors: "#ff0000, #0000ff",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "repeating-linear-gradient("
      );
    }
  });

  it("should fail with less than 2 color stops", async () => {
    const result = await executeTool(cssGradientGenerator, {
      colors: "#ff0000",
    });
    expect(result.success).toBe(false);
  });
});

// ─── CSS Box Shadow ────────────────────────────────────────────────────────────

describe("CSS Box Shadow Generator", () => {
  it("should have correct metadata", () => {
    expect(cssBoxShadow.meta.id).toBe("css/box-shadow");
    expect(cssBoxShadow.meta.category).toBe("css");
  });

  it("should generate box shadow with defaults", async () => {
    const result = await executeTool(cssBoxShadow, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "box-shadow:"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        ".shadow {"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "-webkit-box-shadow:"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "-moz-box-shadow:"
      );
    }
  });

  it("should generate inset shadow", async () => {
    const result = await executeTool(cssBoxShadow, {
      inset: true,
      offsetX: 2,
      offsetY: 2,
      blur: 5,
      spread: 1,
      color: "rgba(0,0,0,0.5)",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "inset "
      );
    }
  });

  it("should use custom parameters", async () => {
    const result = await executeTool(cssBoxShadow, {
      offsetX: 10,
      offsetY: 10,
      blur: 20,
      spread: 5,
      color: "red",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "10px 10px 20px 5px red"
      );
    }
  });
});

// ─── CSS Border Radius ─────────────────────────────────────────────────────────

describe("CSS Border Radius Generator", () => {
  it("should have correct metadata", () => {
    expect(cssBorderRadius.meta.id).toBe("css/border-radius");
    expect(cssBorderRadius.meta.category).toBe("css");
  });

  it("should generate border radius with defaults (all same)", async () => {
    const result = await executeTool(cssBorderRadius, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "border-radius: 8px;"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        ".rounded {"
      );
    }
  });

  it("should generate different corner values", async () => {
    const result = await executeTool(cssBorderRadius, {
      topLeft: 10,
      topRight: 20,
      bottomRight: 30,
      bottomLeft: 40,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "border-radius: 10px 20px 30px 40px;"
      );
    }
  });

  it("should support percentage unit", async () => {
    const result = await executeTool(cssBorderRadius, {
      topLeft: 50,
      topRight: 50,
      bottomRight: 50,
      bottomLeft: 50,
      unit: "%",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "border-radius: 50%;"
      );
    }
  });
});

// ─── CSS Flexbox Generator ─────────────────────────────────────────────────────

describe("CSS Flexbox Generator", () => {
  it("should have correct metadata", () => {
    expect(cssFlexboxGenerator.meta.id).toBe("css/flexbox-generator");
    expect(cssFlexboxGenerator.meta.category).toBe("css");
  });

  it("should generate flexbox with defaults", async () => {
    const result = await executeTool(cssFlexboxGenerator, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "display: flex;"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "flex-direction: row;"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        ".flex-container {"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        ".flex-item {"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Item 1"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Item 3"
      );
    }
  });

  it("should generate column layout with gap", async () => {
    const result = await executeTool(cssFlexboxGenerator, {
      direction: "column",
      justifyContent: "center",
      alignItems: "center",
      gap: 16,
      itemCount: 5,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "flex-direction: column;"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "justify-content: center;"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "gap: 16px;"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Item 5"
      );
    }
  });

  it("should omit gap when set to 0", async () => {
    const result = await executeTool(cssFlexboxGenerator, { gap: 0 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).not.toContain(
        "gap:"
      );
    }
  });
});

// ─── CSS Grid Generator ────────────────────────────────────────────────────────

describe("CSS Grid Generator", () => {
  it("should have correct metadata", () => {
    expect(cssGridGenerator.meta.id).toBe("css/grid-generator");
    expect(cssGridGenerator.meta.category).toBe("css");
  });

  it("should generate grid with defaults", async () => {
    const result = await executeTool(cssGridGenerator, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "display: grid;"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "grid-template-columns: repeat(3, 1fr);"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        ".grid-container {"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Item 1"
      );
      // 3 columns * 2 rows = 6 items
      expect((result.data as Record<string, unknown>).output).toContain(
        "Item 6"
      );
    }
  });

  it("should generate grid with custom columns and rows", async () => {
    const result = await executeTool(cssGridGenerator, {
      columns: 4,
      rows: 3,
      columnGap: 20,
      rowGap: 10,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "grid-template-columns: repeat(4, 1fr);"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "column-gap: 20px;"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "row-gap: 10px;"
      );
      // 4 * 3 = 12 items
      expect((result.data as Record<string, unknown>).output).toContain(
        "Item 12"
      );
    }
  });

  it("should support auto column sizing", async () => {
    const result = await executeTool(cssGridGenerator, {
      columnSizing: "auto",
      columns: 2,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "grid-template-columns: repeat(2, auto);"
      );
    }
  });

  it("should support custom column template", async () => {
    const result = await executeTool(cssGridGenerator, {
      columnSizing: "custom",
      customColumns: "1fr 2fr 1fr",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "grid-template-columns: 1fr 2fr 1fr;"
      );
    }
  });
});
