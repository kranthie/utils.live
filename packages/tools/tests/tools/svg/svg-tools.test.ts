import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import {
  svgOptimizer,
  svgViewer,
  svgToPngConverter,
  svgToJpg,
  svgToBase64,
  svgToDataUri,
  svgFormatter,
  svgPathEditor,
  svgToCss,
  svgSpriteGenerator,
  svgColorChanger,
  svgWaveGenerator,
  svgBlobGenerator,
  svgPatternGenerator,
  svgAvatarGenerator,
  svgDividerGenerator,
  svgBackgroundGenerator,
} from "../../../src/tools/svg";

const SAMPLE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#ff0000"/></svg>';
const SAMPLE_SVG_WITH_COMMENT =
  '<?xml version="1.0"?><!-- Comment --><svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><title>Test</title><desc>Description</desc><rect width="100" height="100" fill="#ff0000"/></svg>';

// ─── SVG Operations ──────────────────────────────────────────────────

describe("SVG Optimizer", () => {
  it("should have correct metadata", () => {
    expect(svgOptimizer.meta.id).toBe("svg/svg-optimizer");
    expect(svgOptimizer.meta.category).toBe("svg");
  });

  it("should optimize SVG by removing comments and metadata", async () => {
    const result = await executeTool(svgOptimizer, {
      input: SAMPLE_SVG_WITH_COMMENT,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).not.toContain(
        "<!-- Comment -->"
      );
      expect((result.data as Record<string, unknown>).output).not.toContain(
        "<title>"
      );
      expect((result.data as Record<string, unknown>).output).not.toContain(
        "<desc>"
      );
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
    }
  });

  it("should shorten hex colors", async () => {
    const svgWithLongColor =
      '<svg xmlns="http://www.w3.org/2000/svg"><rect fill="#ffffff"/></svg>';
    const result = await executeTool(svgOptimizer, { input: svgWithLongColor });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("#fff");
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(svgOptimizer, { input: "  " });
    expect(result.success).toBe(false);
  });

  it("should reject non-SVG input", async () => {
    const result = await executeTool(svgOptimizer, {
      input: "<div>not svg</div>",
    });
    expect(result.success).toBe(false);
  });
});

describe("SVG Viewer", () => {
  it("should have correct metadata", () => {
    expect(svgViewer.meta.id).toBe("svg/svg-viewer");
    expect(svgViewer.meta.category).toBe("svg");
  });

  it("should wrap SVG for viewing", async () => {
    const result = await executeTool(svgViewer, { input: SAMPLE_SVG });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBeDefined();
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(svgViewer, { input: "  " });
    expect(result.success).toBe(false);
  });

  it("should strip script tags from SVG", async () => {
    const maliciousSvg =
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert("XSS")</script><rect width="100" height="100"/></svg>';
    const result = await executeTool(svgViewer, { input: maliciousSvg });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = String((result.data as Record<string, unknown>).output);
      expect(output).not.toContain("<script");
      expect(output).not.toContain("alert");
      expect(output).toContain("<rect");
    }
  });

  it("should strip event handler attributes from SVG", async () => {
    const maliciousSvg =
      '<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" onclick="alert(1)" onload="alert(2)"/></svg>';
    const result = await executeTool(svgViewer, { input: maliciousSvg });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = String((result.data as Record<string, unknown>).output);
      expect(output).not.toContain("onclick");
      expect(output).not.toContain("onload");
      expect(output).toContain("<rect");
    }
  });

  it("should strip foreignObject elements from SVG", async () => {
    const maliciousSvg =
      '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><body xmlns="http://www.w3.org/1999/xhtml"><script>alert(1)</script></body></foreignObject><rect width="100" height="100"/></svg>';
    const result = await executeTool(svgViewer, { input: maliciousSvg });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = String((result.data as Record<string, unknown>).output);
      expect(output).not.toContain("foreignObject");
      expect(output).not.toContain("<script");
    }
  });

  it("should strip javascript: URIs from SVG", async () => {
    const maliciousSvg =
      '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)"><rect width="100" height="100"/></a></svg>';
    const result = await executeTool(svgViewer, { input: maliciousSvg });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = String((result.data as Record<string, unknown>).output);
      expect(output).not.toContain("javascript:");
    }
  });
});

describe("SVG to PNG Converter", () => {
  it("should have correct metadata", () => {
    expect(svgToPngConverter.meta.id).toBe("svg/svg-to-png");
    expect(svgToPngConverter.meta.category).toBe("svg");
  });

  it("should process SVG for conversion (fallback in Node.js)", async () => {
    const result = await executeTool(svgToPngConverter, { input: SAMPLE_SVG });
    expect(result.success).toBe(true);
    if (result.success) {
      // In Node.js test env, Canvas is not available so we get a fallback message
      expect((result.data as Record<string, unknown>).output).toContain(
        "Canvas API"
      );
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(svgToPngConverter, { input: "  " });
    expect(result.success).toBe(false);
  });

  it("should reject non-SVG input", async () => {
    const result = await executeTool(svgToPngConverter, {
      input: "<div>not svg</div>",
    });
    expect(result.success).toBe(false);
  });
});

describe("SVG to JPG", () => {
  it("should have correct metadata", () => {
    expect(svgToJpg.meta.id).toBe("svg/svg-to-jpg");
    expect(svgToJpg.meta.category).toBe("svg");
  });

  it("should process SVG for JPG conversion (fallback in Node.js)", async () => {
    const result = await executeTool(svgToJpg, { input: SAMPLE_SVG });
    expect(result.success).toBe(true);
    if (result.success) {
      // In Node.js test env, Canvas is not available so we get a fallback message
      expect((result.data as Record<string, unknown>).output).toContain(
        "Canvas API"
      );
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(svgToJpg, { input: "  " });
    expect(result.success).toBe(false);
  });

  it("should reject non-SVG input", async () => {
    const result = await executeTool(svgToJpg, {
      input: "<div>not svg</div>",
    });
    expect(result.success).toBe(false);
  });
});

describe("SVG to Base64", () => {
  it("should have correct metadata", () => {
    expect(svgToBase64.meta.id).toBe("svg/svg-to-base64");
    expect(svgToBase64.meta.category).toBe("svg");
  });

  it("should convert SVG to base64 data URL", async () => {
    const result = await executeTool(svgToBase64, { input: SAMPLE_SVG });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "data:image/svg+xml;base64,"
      );
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(svgToBase64, { input: "  " });
    expect(result.success).toBe(false);
  });
});

describe("SVG to Data URI", () => {
  it("should have correct metadata", () => {
    expect(svgToDataUri.meta.id).toBe("svg/svg-to-data-uri");
    expect(svgToDataUri.meta.category).toBe("svg");
  });

  it("should convert SVG to URL-encoded data URI", async () => {
    const result = await executeTool(svgToDataUri, { input: SAMPLE_SVG });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "data:image/svg+xml,"
      );
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(svgToDataUri, { input: "  " });
    expect(result.success).toBe(false);
  });
});

describe("SVG Formatter", () => {
  it("should have correct metadata", () => {
    expect(svgFormatter.meta.id).toBe("svg/svg-formatter");
    expect(svgFormatter.meta.category).toBe("svg");
  });

  it("should format minified SVG", async () => {
    const minified =
      '<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100"/><circle cx="50" cy="50" r="25"/></svg>';
    const result = await executeTool(svgFormatter, { input: minified });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("\n");
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
    }
  });

  it("should support tab indentation", async () => {
    const result = await executeTool(
      svgFormatter,
      { input: SAMPLE_SVG },
      { indentChar: "tab" }
    );
    expect(result.success).toBe(true);
  });

  it("should reject empty input", async () => {
    const result = await executeTool(svgFormatter, { input: "  " });
    expect(result.success).toBe(false);
  });
});

describe("SVG Path Editor", () => {
  it("should have correct metadata", () => {
    expect(svgPathEditor.meta.id).toBe("svg/svg-path-editor");
    expect(svgPathEditor.meta.category).toBe("svg");
  });

  it("should parse SVG path commands", async () => {
    const result = await executeTool(svgPathEditor, {
      input: "M 10 20 L 30 40 Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Move to"
      );
    }
  });

  it("should handle complex path with curves", async () => {
    const result = await executeTool(svgPathEditor, {
      input: "M 0 0 C 10 20 30 40 50 50 Z",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty input", async () => {
    const result = await executeTool(svgPathEditor, { input: "  " });
    expect(result.success).toBe(false);
  });
});

describe("SVG to CSS", () => {
  it("should have correct metadata", () => {
    expect(svgToCss.meta.id).toBe("svg/svg-to-css");
    expect(svgToCss.meta.category).toBe("svg");
  });

  it("should convert SVG to CSS background-image", async () => {
    const result = await executeTool(
      svgToCss,
      { input: SAMPLE_SVG },
      { method: "background-image" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "background-image"
      );
    }
  });

  it("should support mask-image method", async () => {
    const result = await executeTool(
      svgToCss,
      { input: SAMPLE_SVG },
      { method: "mask-image" }
    );
    expect(result.success).toBe(true);
  });

  it("should reject empty input", async () => {
    const result = await executeTool(svgToCss, { input: "  " });
    expect(result.success).toBe(false);
  });
});

describe("SVG Sprite Generator", () => {
  it("should have correct metadata", () => {
    expect(svgSpriteGenerator.meta.id).toBe("svg/svg-sprite-generator");
    expect(svgSpriteGenerator.meta.category).toBe("svg");
  });

  it("should combine multiple SVGs into sprite", async () => {
    const result = await executeTool(svgSpriteGenerator, {
      icons: [
        {
          id: "icon-home",
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3z"/></svg>',
        },
        {
          id: "icon-user",
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/></svg>',
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "icon-home"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "icon-user"
      );
    }
  });

  it("should handle single icon", async () => {
    const result = await executeTool(svgSpriteGenerator, {
      icons: [{ id: "single", svg: SAMPLE_SVG }],
    });
    expect(result.success).toBe(true);
  });

  it("should fail with empty icons", async () => {
    const result = await executeTool(svgSpriteGenerator, { icons: [] });
    expect(result.success).toBe(false);
  });
});

describe("SVG Color Changer", () => {
  it("should have correct metadata", () => {
    expect(svgColorChanger.meta.id).toBe("svg/svg-color-changer");
    expect(svgColorChanger.meta.category).toBe("svg");
  });

  it("should replace color in SVG", async () => {
    const result = await executeTool(
      svgColorChanger,
      { input: SAMPLE_SVG },
      { fromColor: "#ff0000", toColor: "#0000ff" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "#0000ff"
      );
      expect((result.data as Record<string, unknown>).output).not.toContain(
        "#ff0000"
      );
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(
      svgColorChanger,
      { input: "  " },
      { fromColor: "#000", toColor: "#fff" }
    );
    expect(result.success).toBe(false);
  });
});

// ─── SVG Generators ──────────────────────────────────────────────────

describe("SVG Wave Generator", () => {
  it("should have correct metadata", () => {
    expect(svgWaveGenerator.meta.id).toBe("svg/svg-wave-generator");
    expect(svgWaveGenerator.meta.category).toBe("svg");
  });

  it("should generate wave SVG with defaults", async () => {
    const result = await executeTool(svgWaveGenerator, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
      expect((result.data as Record<string, unknown>).output).toContain(
        "</svg>"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "<path"
      );
    }
  });

  it("should generate flipped wave", async () => {
    const result = await executeTool(svgWaveGenerator, {
      flip: true,
      waves: 2,
      color: "#336699",
    });
    expect(result.success).toBe(true);
  });

  it("should generate wave with custom dimensions", async () => {
    const result = await executeTool(svgWaveGenerator, {
      width: 800,
      height: 200,
      amplitude: 50,
      frequency: 3,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        'width="800"'
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        'height="200"'
      );
    }
  });
});

describe("SVG Blob Generator", () => {
  it("should have correct metadata", () => {
    expect(svgBlobGenerator.meta.id).toBe("svg/svg-blob-generator");
    expect(svgBlobGenerator.meta.category).toBe("svg");
  });

  it("should generate blob SVG with defaults", async () => {
    const result = await executeTool(svgBlobGenerator, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
      expect((result.data as Record<string, unknown>).output).toContain(
        "<path"
      );
    }
  });

  it("should produce reproducible output with same seed", async () => {
    const result1 = await executeTool(svgBlobGenerator, { seed: 123 });
    const result2 = await executeTool(svgBlobGenerator, { seed: 123 });
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    if (result1.success && result2.success) {
      expect((result1.data as Record<string, unknown>).output).toBe(
        (result2.data as Record<string, unknown>).output
      );
    }
  });

  it("should support stroke outline", async () => {
    const result = await executeTool(svgBlobGenerator, {
      stroke: true,
      strokeWidth: 3,
      strokeColor: "#333",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        'stroke="#333"'
      );
    }
  });
});

describe("SVG Pattern Generator", () => {
  it("should have correct metadata", () => {
    expect(svgPatternGenerator.meta.id).toBe("svg/svg-pattern-generator");
    expect(svgPatternGenerator.meta.category).toBe("svg");
  });

  it("should generate dots pattern", async () => {
    const result = await executeTool(svgPatternGenerator, { pattern: "dots" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
      expect((result.data as Record<string, unknown>).output).toContain(
        "<pattern"
      );
    }
  });

  it("should generate grid pattern", async () => {
    const result = await executeTool(svgPatternGenerator, {
      pattern: "grid",
      color: "#999",
      tileSize: 30,
    });
    expect(result.success).toBe(true);
  });

  it("should generate crosshatch pattern", async () => {
    const result = await executeTool(svgPatternGenerator, {
      pattern: "crosshatch",
    });
    expect(result.success).toBe(true);
  });
});

describe("SVG Avatar Generator", () => {
  it("should have correct metadata", () => {
    expect(svgAvatarGenerator.meta.id).toBe("svg/svg-avatar-generator");
    expect(svgAvatarGenerator.meta.category).toBe("svg");
  });

  it("should generate initials avatar", async () => {
    const result = await executeTool(svgAvatarGenerator, {
      text: "JD",
      style: "initials",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
      expect((result.data as Record<string, unknown>).output).toContain("JD");
    }
  });

  it("should generate geometric avatar", async () => {
    const result = await executeTool(svgAvatarGenerator, {
      text: "A",
      style: "geometric",
      shape: "square",
    });
    expect(result.success).toBe(true);
  });

  it("should generate rings avatar", async () => {
    const result = await executeTool(svgAvatarGenerator, {
      text: "XY",
      style: "rings",
      shape: "circle",
      size: 200,
    });
    expect(result.success).toBe(true);
  });

  it("should fail with empty text", async () => {
    const result = await executeTool(svgAvatarGenerator, { text: "" });
    expect(result.success).toBe(false);
  });
});

describe("SVG Divider Generator", () => {
  it("should have correct metadata", () => {
    expect(svgDividerGenerator.meta.id).toBe("svg/svg-divider-generator");
    expect(svgDividerGenerator.meta.category).toBe("svg");
  });

  it("should generate wave divider", async () => {
    const result = await executeTool(svgDividerGenerator, { style: "wave" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
    }
  });

  it("should generate triangle divider", async () => {
    const result = await executeTool(svgDividerGenerator, {
      style: "triangle",
    });
    expect(result.success).toBe(true);
  });

  it("should support flip", async () => {
    const result = await executeTool(svgDividerGenerator, {
      style: "slant",
      flip: true,
    });
    expect(result.success).toBe(true);
  });

  it("should generate all divider styles", async () => {
    const styles = [
      "wave",
      "triangle",
      "curve",
      "slant",
      "zigzag",
      "arrow",
      "rounded",
    ] as const;
    for (const style of styles) {
      const result = await executeTool(svgDividerGenerator, { style });
      expect(result.success).toBe(true);
    }
  });
});

describe("SVG Background Generator", () => {
  it("should have correct metadata", () => {
    expect(svgBackgroundGenerator.meta.id).toBe("svg/svg-background-generator");
    expect(svgBackgroundGenerator.meta.category).toBe("svg");
  });

  it("should generate gradient background", async () => {
    const result = await executeTool(svgBackgroundGenerator, {
      style: "gradient",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
    }
  });

  it("should generate circles background", async () => {
    const result = await executeTool(svgBackgroundGenerator, {
      style: "circles",
      color1: "#ff6600",
      color2: "#003366",
    });
    expect(result.success).toBe(true);
  });

  it("should produce reproducible output with same seed", async () => {
    const result1 = await executeTool(svgBackgroundGenerator, {
      style: "noise",
      seed: 99,
    });
    const result2 = await executeTool(svgBackgroundGenerator, {
      style: "noise",
      seed: 99,
    });
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    if (result1.success && result2.success) {
      expect((result1.data as Record<string, unknown>).output).toBe(
        (result2.data as Record<string, unknown>).output
      );
    }
  });
});
