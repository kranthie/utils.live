import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import {
  hexToRgb,
  rgbToHexTool,
  hexToHsl,
  hslToHexTool,
  rgbToHslTool,
  hslToRgbTool,
  rgbToCmykTool,
  cmykToRgbTool,
  hexToHsv,
  colorNameToHex,
  hexToColorName,
  allColorFormats,
  colorPicker,
  randomColor,
  paletteGenerator,
  complementaryColor,
  analogousColors,
  triadicColors,
  splitComplementary,
  colorShades,
  colorTints,
  gradientGenerator,
  contrastChecker,
  colorBlindnessSimulator,
  colorBrightness,
  colorLuminance,
  colorDistance,
  colorMixer,
  colorInverter,
} from "../../../src/tools/color";

// ─── Color Conversion Tools ────────────────────────────────────────────────────

describe("Hex to RGB", () => {
  it("should have correct metadata", () => {
    expect(hexToRgb.meta.id).toBe("color/hex-to-rgb");
    expect(hexToRgb.meta.category).toBe("color");
  });

  it("should convert #FF5733 to rgb(255, 87, 51)", async () => {
    const result = await executeTool(hexToRgb, { input: "#FF5733" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBe(
        "rgb(255, 87, 51)"
      );
    }
  });

  it("should convert #000000 to rgb(0, 0, 0)", async () => {
    const result = await executeTool(hexToRgb, { input: "#000000" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBe(
        "rgb(0, 0, 0)"
      );
    }
  });

  it("should convert #FFFFFF to rgb(255, 255, 255)", async () => {
    const result = await executeTool(hexToRgb, { input: "#FFFFFF" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBe(
        "rgb(255, 255, 255)"
      );
    }
  });

  it("should handle shorthand hex #FFF", async () => {
    const result = await executeTool(hexToRgb, { input: "#FFF" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBe(
        "rgb(255, 255, 255)"
      );
    }
  });
});

describe("RGB to Hex", () => {
  it("should have correct metadata", () => {
    expect(rgbToHexTool.meta.id).toBe("color/rgb-to-hex");
    expect(rgbToHexTool.meta.category).toBe("color");
  });

  it("should convert rgb(255, 87, 51) to hex", async () => {
    const result = await executeTool(rgbToHexTool, {
      input: "rgb(255, 87, 51)",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        String((result.data as Record<string, unknown>).output).toLowerCase()
      ).toBe("#ff5733");
    }
  });

  it("should convert plain values '0, 0, 0'", async () => {
    const result = await executeTool(rgbToHexTool, { input: "0, 0, 0" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        String((result.data as Record<string, unknown>).output).toLowerCase()
      ).toBe("#000000");
    }
  });

  it("should fail on invalid RGB format", async () => {
    const result = await executeTool(rgbToHexTool, { input: "not-rgb" });
    expect(result.success).toBe(false);
  });
});

describe("Hex to HSL", () => {
  it("should have correct metadata", () => {
    expect(hexToHsl.meta.id).toBe("color/hex-to-hsl");
    expect(hexToHsl.meta.category).toBe("color");
  });

  it("should convert #FF0000 to hsl with hue 0", async () => {
    const result = await executeTool(hexToHsl, { input: "#FF0000" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("hsl(");
      expect((result.data as Record<string, unknown>).output).toContain("0,");
    }
  });

  it("should convert white #FFFFFF", async () => {
    const result = await executeTool(hexToHsl, { input: "#FFFFFF" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("100%");
    }
  });
});

describe("HSL to Hex", () => {
  it("should have correct metadata", () => {
    expect(hslToHexTool.meta.id).toBe("color/hsl-to-hex");
    expect(hslToHexTool.meta.category).toBe("color");
  });

  it("should convert hsl(0, 100%, 50%) to red hex", async () => {
    const result = await executeTool(hslToHexTool, {
      input: "hsl(0, 100%, 50%)",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        String((result.data as Record<string, unknown>).output).toLowerCase()
      ).toBe("#ff0000");
    }
  });

  it("should convert plain values '0, 100, 50'", async () => {
    const result = await executeTool(hslToHexTool, { input: "0, 100, 50" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        String((result.data as Record<string, unknown>).output).toLowerCase()
      ).toBe("#ff0000");
    }
  });

  it("should fail on invalid HSL format", async () => {
    const result = await executeTool(hslToHexTool, { input: "invalid" });
    expect(result.success).toBe(false);
  });
});

describe("RGB to HSL", () => {
  it("should have correct metadata", () => {
    expect(rgbToHslTool.meta.id).toBe("color/rgb-to-hsl");
    expect(rgbToHslTool.meta.category).toBe("color");
  });

  it("should convert rgb(255, 0, 0) to hsl", async () => {
    const result = await executeTool(rgbToHslTool, { input: "255, 0, 0" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "hsl(0,"
      );
      expect((result.data as Record<string, unknown>).output).toContain("100%");
      expect((result.data as Record<string, unknown>).output).toContain("50%");
    }
  });

  it("should convert rgb gray (128, 128, 128)", async () => {
    const result = await executeTool(rgbToHslTool, { input: "128, 128, 128" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("0%"); // saturation should be 0%
    }
  });
});

describe("HSL to RGB", () => {
  it("should have correct metadata", () => {
    expect(hslToRgbTool.meta.id).toBe("color/hsl-to-rgb");
    expect(hslToRgbTool.meta.category).toBe("color");
  });

  it("should convert hsl(0, 100%, 50%) to rgb(255, 0, 0)", async () => {
    const result = await executeTool(hslToRgbTool, { input: "0, 100, 50" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBe(
        "rgb(255, 0, 0)"
      );
    }
  });

  it("should convert achromatic hsl(0, 0, 50)", async () => {
    const result = await executeTool(hslToRgbTool, { input: "0, 0, 50" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBe(
        "rgb(128, 128, 128)"
      );
    }
  });
});

describe("RGB to CMYK", () => {
  it("should have correct metadata", () => {
    expect(rgbToCmykTool.meta.id).toBe("color/rgb-to-cmyk");
    expect(rgbToCmykTool.meta.category).toBe("color");
  });

  it("should convert red to CMYK", async () => {
    const result = await executeTool(rgbToCmykTool, { input: "255, 0, 0" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "cmyk("
      );
      expect((result.data as Record<string, unknown>).output).toContain("0%"); // C should be 0
    }
  });

  it("should convert white to CMYK", async () => {
    const result = await executeTool(rgbToCmykTool, { input: "255, 255, 255" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("0%");
    }
  });
});

describe("CMYK to RGB", () => {
  it("should have correct metadata", () => {
    expect(cmykToRgbTool.meta.id).toBe("color/cmyk-to-rgb");
    expect(cmykToRgbTool.meta.category).toBe("color");
  });

  it("should convert cmyk(0, 100, 100, 0) to red", async () => {
    const result = await executeTool(cmykToRgbTool, {
      input: "0, 100, 100, 0",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBe(
        "rgb(255, 0, 0)"
      );
    }
  });

  it("should convert cmyk percentages", async () => {
    const result = await executeTool(cmykToRgbTool, {
      input: "cmyk(0%, 0%, 0%, 0%)",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBe(
        "rgb(255, 255, 255)"
      );
    }
  });

  it("should fail on invalid CMYK format", async () => {
    const result = await executeTool(cmykToRgbTool, { input: "invalid" });
    expect(result.success).toBe(false);
  });
});

describe("Hex to HSV", () => {
  it("should have correct metadata", () => {
    expect(hexToHsv.meta.id).toBe("color/hex-to-hsv");
    expect(hexToHsv.meta.category).toBe("color");
  });

  it("should convert #FF0000 to hsv", async () => {
    const result = await executeTool(hexToHsv, { input: "#FF0000" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "hsv(0,"
      );
      expect((result.data as Record<string, unknown>).output).toContain("100%");
    }
  });

  it("should convert black #000000", async () => {
    const result = await executeTool(hexToHsv, { input: "#000000" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("0%");
    }
  });
});

describe("Color Name to Hex", () => {
  it("should have correct metadata", () => {
    expect(colorNameToHex.meta.id).toBe("color/color-name-to-hex");
    expect(colorNameToHex.meta.category).toBe("color");
  });

  it("should convert 'red' to hex", async () => {
    const result = await executeTool(colorNameToHex, { input: "red" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        String((result.data as Record<string, unknown>).output).toLowerCase()
      ).toContain("ff0000");
    }
  });

  it("should convert 'coral' to hex", async () => {
    const result = await executeTool(colorNameToHex, { input: "coral" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        String((result.data as Record<string, unknown>).output).toLowerCase()
      ).toContain("ff7f50");
    }
  });

  it("should fail on unknown color name", async () => {
    const result = await executeTool(colorNameToHex, { input: "notacolor" });
    expect(result.success).toBe(false);
  });
});

describe("Hex to Color Name", () => {
  it("should have correct metadata", () => {
    expect(hexToColorName.meta.id).toBe("color/hex-to-color-name");
    expect(hexToColorName.meta.category).toBe("color");
  });

  it("should find exact match for #FF7F50 (coral)", async () => {
    const result = await executeTool(hexToColorName, { input: "#FF7F50" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "coral"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "exact match"
      );
    }
  });

  it("should find nearest match for arbitrary color", async () => {
    const result = await executeTool(hexToColorName, { input: "#FF7F51" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "distance:"
      );
    }
  });
});

describe("All Color Formats", () => {
  it("should have correct metadata", () => {
    expect(allColorFormats.meta.id).toBe("color/all-color-formats");
    expect(allColorFormats.meta.category).toBe("color");
  });

  it("should display all formats for #FF5733", async () => {
    const result = await executeTool(allColorFormats, { input: "#FF5733" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("Hex:");
      expect((result.data as Record<string, unknown>).output).toContain("RGB:");
      expect((result.data as Record<string, unknown>).output).toContain("HSL:");
      expect((result.data as Record<string, unknown>).output).toContain("HSV:");
      expect((result.data as Record<string, unknown>).output).toContain(
        "CMYK:"
      );
    }
  });

  it("should accept color name input", async () => {
    const result = await executeTool(allColorFormats, { input: "red" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("Hex:");
    }
  });
});

// ─── Color Generation Tools ────────────────────────────────────────────────────

describe("Color Picker", () => {
  it("should have correct metadata", () => {
    expect(colorPicker.meta.id).toBe("color/color-picker");
    expect(colorPicker.meta.category).toBe("color");
  });

  it("should display color details for hex input", async () => {
    const result = await executeTool(colorPicker, { input: "#3498db" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("Hex:");
      expect((result.data as Record<string, unknown>).output).toContain("RGB:");
      expect((result.data as Record<string, unknown>).output).toContain(
        "Brightness:"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Luminance:"
      );
    }
  });

  it("should work with color name input", async () => {
    const result = await executeTool(colorPicker, { input: "coral" });
    expect(result.success).toBe(true);
  });
});

describe("Random Color Generator", () => {
  it("should have correct metadata", () => {
    expect(randomColor.meta.id).toBe("color/random-color");
    expect(randomColor.meta.category).toBe("color");
  });

  it("should generate default 5 colors in hex format", async () => {
    const result = await executeTool(randomColor, {});
    expect(result.success).toBe(true);
    if (result.success) {
      const colors = String((result.data as Record<string, unknown>).output)
        .split("\n")
        .filter(Boolean);
      expect(colors.length).toBe(5);
      colors.forEach((c: string) => expect(c).toMatch(/^#[0-9a-fA-F]{6}$/));
    }
  });

  it("should generate specified count in rgb format", async () => {
    const result = await executeTool(randomColor, { count: 3, format: "rgb" });
    expect(result.success).toBe(true);
    if (result.success) {
      const colors = String((result.data as Record<string, unknown>).output)
        .split("\n")
        .filter(Boolean);
      expect(colors.length).toBe(3);
      colors.forEach((c: string) =>
        expect(c).toMatch(/^rgb\(\d+, \d+, \d+\)$/)
      );
    }
  });

  it("should generate in hsl format", async () => {
    const result = await executeTool(randomColor, { count: 2, format: "hsl" });
    expect(result.success).toBe(true);
    if (result.success) {
      const colors = String((result.data as Record<string, unknown>).output)
        .split("\n")
        .filter(Boolean);
      expect(colors.length).toBe(2);
      colors.forEach((c: string) => expect(c).toMatch(/^hsl\(/));
    }
  });
});

describe("Palette Generator", () => {
  it("should have correct metadata", () => {
    expect(paletteGenerator.meta.id).toBe("color/palette-generator");
    expect(paletteGenerator.meta.category).toBe("color");
  });

  it("should generate analogous palette with defaults", async () => {
    const result = await executeTool(paletteGenerator, {});
    expect(result.success).toBe(true);
    if (result.success) {
      const colors = String((result.data as Record<string, unknown>).output)
        .split("\n")
        .filter(Boolean);
      expect(colors.length).toBe(5);
    }
  });

  it("should generate monochromatic palette", async () => {
    const result = await executeTool(paletteGenerator, {
      count: 4,
      hue: 120,
      harmony: "monochromatic",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const colors = String((result.data as Record<string, unknown>).output)
        .split("\n")
        .filter(Boolean);
      expect(colors.length).toBe(4);
    }
  });

  it("should generate complementary palette", async () => {
    const result = await executeTool(paletteGenerator, {
      harmony: "complementary",
    });
    expect(result.success).toBe(true);
  });

  it("should generate triadic palette", async () => {
    const result = await executeTool(paletteGenerator, { harmony: "triadic" });
    expect(result.success).toBe(true);
  });
});

describe("Complementary Color", () => {
  it("should have correct metadata", () => {
    expect(complementaryColor.meta.id).toBe("color/complementary-color");
    expect(complementaryColor.meta.category).toBe("color");
  });

  it("should find complementary of red", async () => {
    const result = await executeTool(complementaryColor, { input: "#FF0000" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("->");
      expect(
        String((result.data as Record<string, unknown>).output).toLowerCase()
      ).toContain("#00ffff"); // cyan is complement of red
    }
  });

  it("should work with color name", async () => {
    const result = await executeTool(complementaryColor, { input: "blue" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("->");
    }
  });
});

describe("Analogous Colors", () => {
  it("should have correct metadata", () => {
    expect(analogousColors.meta.id).toBe("color/analogous-colors");
    expect(analogousColors.meta.category).toBe("color");
  });

  it("should return 3 analogous colors", async () => {
    const result = await executeTool(analogousColors, { input: "#FF0000" });
    expect(result.success).toBe(true);
    if (result.success) {
      const colors = String((result.data as Record<string, unknown>).output)
        .split("\n")
        .filter(Boolean);
      expect(colors.length).toBe(3);
    }
  });
});

describe("Triadic Colors", () => {
  it("should have correct metadata", () => {
    expect(triadicColors.meta.id).toBe("color/triadic-colors");
    expect(triadicColors.meta.category).toBe("color");
  });

  it("should return 3 triadic colors", async () => {
    const result = await executeTool(triadicColors, { input: "#FF0000" });
    expect(result.success).toBe(true);
    if (result.success) {
      const colors = String((result.data as Record<string, unknown>).output)
        .split("\n")
        .filter(Boolean);
      expect(colors.length).toBe(3);
    }
  });
});

describe("Split Complementary", () => {
  it("should have correct metadata", () => {
    expect(splitComplementary.meta.id).toBe("color/split-complementary");
    expect(splitComplementary.meta.category).toBe("color");
  });

  it("should return 3 split-complementary colors", async () => {
    const result = await executeTool(splitComplementary, { input: "#FF0000" });
    expect(result.success).toBe(true);
    if (result.success) {
      const colors = String((result.data as Record<string, unknown>).output)
        .split("\n")
        .filter(Boolean);
      expect(colors.length).toBe(3);
    }
  });
});

describe("Color Shades", () => {
  it("should have correct metadata", () => {
    expect(colorShades.meta.id).toBe("color/color-shades");
    expect(colorShades.meta.category).toBe("color");
  });

  it("should generate 5 shades by default", async () => {
    const result = await executeTool(colorShades, { input: "#3498db" });
    expect(result.success).toBe(true);
    if (result.success) {
      const colors = String((result.data as Record<string, unknown>).output)
        .split("\n")
        .filter(Boolean);
      expect(colors.length).toBe(5);
    }
  });

  it("should generate custom number of shades with options", async () => {
    const result = await executeTool(
      colorShades,
      { input: "#3498db" },
      { count: 3 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const colors = String((result.data as Record<string, unknown>).output)
        .split("\n")
        .filter(Boolean);
      expect(colors.length).toBe(3);
    }
  });
});

describe("Color Tints", () => {
  it("should have correct metadata", () => {
    expect(colorTints.meta.id).toBe("color/color-tints");
    expect(colorTints.meta.category).toBe("color");
  });

  it("should generate 5 tints by default", async () => {
    const result = await executeTool(colorTints, { input: "#3498db" });
    expect(result.success).toBe(true);
    if (result.success) {
      const colors = String((result.data as Record<string, unknown>).output)
        .split("\n")
        .filter(Boolean);
      expect(colors.length).toBe(5);
    }
  });

  it("should generate custom number of tints with options", async () => {
    const result = await executeTool(
      colorTints,
      { input: "#3498db" },
      { count: 3 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const colors = String((result.data as Record<string, unknown>).output)
        .split("\n")
        .filter(Boolean);
      expect(colors.length).toBe(3);
    }
  });
});

describe("Gradient Generator", () => {
  it("should have correct metadata", () => {
    expect(gradientGenerator.meta.id).toBe("color/gradient-generator");
    expect(gradientGenerator.meta.category).toBe("color");
  });

  it("should generate gradient with defaults", async () => {
    const result = await executeTool(gradientGenerator, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "CSS: linear-gradient(to right,"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Color Stops:"
      );
    }
  });

  it("should generate radial gradient", async () => {
    const result = await executeTool(gradientGenerator, {
      color1: "#FF0000",
      color2: "#0000FF",
      direction: "radial",
      steps: 3,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "radial-gradient("
      );
    }
  });
});

// ─── Color Analysis Tools ──────────────────────────────────────────────────────

describe("Contrast Checker", () => {
  it("should have correct metadata", () => {
    expect(contrastChecker.meta.id).toBe("color/contrast-checker");
    expect(contrastChecker.meta.category).toBe("color");
  });

  it("should check contrast between black and white", async () => {
    const result = await executeTool(contrastChecker, {
      input1: "#000000",
      input2: "#FFFFFF",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).modified).toContain(
        "PASS"
      );
      expect((result.data as Record<string, unknown>).modified).toContain(
        "21.00:1"
      );
    }
  });

  it("should check contrast between similar colors", async () => {
    const result = await executeTool(contrastChecker, {
      input1: "#777777",
      input2: "#888888",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).modified).toContain(
        "FAIL"
      );
    }
  });
});

describe("Color Blindness Simulator", () => {
  it("should have correct metadata", () => {
    expect(colorBlindnessSimulator.meta.id).toBe(
      "color/color-blindness-simulator"
    );
    expect(colorBlindnessSimulator.meta.category).toBe("color");
  });

  it("should simulate color blindness for a given color", async () => {
    const result = await executeTool(colorBlindnessSimulator, {
      input: "#FF0000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Original:"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Protanopia"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Deuteranopia"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Tritanopia"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Achromatopsia"
      );
    }
  });

  it("should work with color name", async () => {
    const result = await executeTool(colorBlindnessSimulator, {
      input: "blue",
    });
    expect(result.success).toBe(true);
  });
});

describe("Color Brightness", () => {
  it("should have correct metadata", () => {
    expect(colorBrightness.meta.id).toBe("color/color-brightness");
    expect(colorBrightness.meta.category).toBe("color");
  });

  it("should categorize white as light", async () => {
    const result = await executeTool(colorBrightness, { input: "#FFFFFF" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Light"
      );
    }
  });

  it("should categorize black as dark", async () => {
    const result = await executeTool(colorBrightness, { input: "#000000" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("Dark");
    }
  });
});

describe("Color Luminance", () => {
  it("should have correct metadata", () => {
    expect(colorLuminance.meta.id).toBe("color/color-luminance");
    expect(colorLuminance.meta.category).toBe("color");
  });

  it("should calculate luminance of white as ~1", async () => {
    const result = await executeTool(colorLuminance, { input: "#FFFFFF" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "1.000000"
      );
    }
  });

  it("should calculate luminance of black as ~0", async () => {
    const result = await executeTool(colorLuminance, { input: "#000000" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "0.000000"
      );
    }
  });
});

describe("Color Distance", () => {
  it("should have correct metadata", () => {
    expect(colorDistance.meta.id).toBe("color/color-distance");
    expect(colorDistance.meta.category).toBe("color");
  });

  it("should detect identical colors", async () => {
    const result = await executeTool(colorDistance, {
      input1: "#FF0000",
      input2: "#FF0000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).modified).toContain(
        "Delta E: 0.00"
      );
      expect((result.data as Record<string, unknown>).modified).toContain(
        "Identical"
      );
    }
  });

  it("should detect very different colors", async () => {
    const result = await executeTool(colorDistance, {
      input1: "#000000",
      input2: "#FFFFFF",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).modified).toContain(
        "Delta E:"
      );
    }
  });
});

describe("Color Mixer", () => {
  it("should have correct metadata", () => {
    expect(colorMixer.meta.id).toBe("color/color-mixer");
    expect(colorMixer.meta.category).toBe("color");
  });

  it("should mix two colors at 50%", async () => {
    const result = await executeTool(colorMixer, {
      input1: "#FF0000",
      input2: "#0000FF",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).modified).toContain(
        "Mixed (50%):"
      );
    }
  });

  it("should mix with custom ratio", async () => {
    const result = await executeTool(
      colorMixer,
      { input1: "#FF0000", input2: "#0000FF" },
      { ratio: 0 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).modified).toContain(
        "Mixed (0%):"
      );
      // At ratio 0, result should be all color1 (red)
      expect(
        String((result.data as Record<string, unknown>).modified).toLowerCase()
      ).toContain("#ff0000");
    }
  });
});

describe("Color Inverter", () => {
  it("should have correct metadata", () => {
    expect(colorInverter.meta.id).toBe("color/color-inverter");
    expect(colorInverter.meta.category).toBe("color");
  });

  it("should invert black to white", async () => {
    const result = await executeTool(colorInverter, { input: "#000000" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        String((result.data as Record<string, unknown>).output).toLowerCase()
      ).toContain("#ffffff");
    }
  });

  it("should invert white to black", async () => {
    const result = await executeTool(colorInverter, { input: "#FFFFFF" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        String((result.data as Record<string, unknown>).output).toLowerCase()
      ).toContain("#000000");
    }
  });

  it("should invert red to cyan", async () => {
    const result = await executeTool(colorInverter, { input: "#FF0000" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        String((result.data as Record<string, unknown>).output).toLowerCase()
      ).toContain("#00ffff");
    }
  });
});
