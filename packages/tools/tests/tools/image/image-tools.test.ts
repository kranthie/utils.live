import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import {
  pngToJpg,
  jpgToPng,
  imageToWebp,
  webpToPng,
  imageToBase64,
  base64ToImage,
  imageToDataUrl,
  imageResizer,
  imageCropper,
  imageRotator,
  imageFlipper,
  imageCompressor,
  aspectRatioCalculator,
  imageBorderAdder,
  imageWatermark,
  roundCorners,
  circleCrop,
  thumbnailGenerator,
  imageSplitter,
  grayscale,
  sepia,
  invertColors,
  brightnessAdjuster,
  contrastAdjuster,
  blurFilter,
  sharpenFilter,
  pixelate,
  posterize,
  duotone,
  imageInfo,
  exifReader,
  exifRemover,
  colorPickerFromImage,
  dominantColors,
  imageHistogram,
  imageDiff,
  placeholderImage,
} from "../../../src/tools/image";

const SAMPLE_BASE64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
const SAMPLE_BASE64_RAW =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

// ─── Image Conversion ────────────────────────────────────────────────

describe("PNG to JPG", () => {
  it("should have correct metadata", () => {
    expect(pngToJpg.meta.id).toBe("image/png-to-jpg");
    expect(pngToJpg.meta.category).toBe("image");
  });

  it("should process PNG image data", async () => {
    const result = await executeTool(pngToJpg, { input: SAMPLE_BASE64 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBeDefined();
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(pngToJpg, { input: "  " });
    expect(result.success).toBe(false);
  });
});

describe("JPG to PNG", () => {
  it("should have correct metadata", () => {
    expect(jpgToPng.meta.id).toBe("image/jpg-to-png");
    expect(jpgToPng.meta.category).toBe("image");
  });

  it("should process JPG image data", async () => {
    const result = await executeTool(jpgToPng, { input: SAMPLE_BASE64 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBeDefined();
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(jpgToPng, { input: "" });
    expect(result.success).toBe(false);
  });
});

describe("Image to WebP", () => {
  it("should have correct metadata", () => {
    expect(imageToWebp.meta.id).toBe("image/image-to-webp");
    expect(imageToWebp.meta.category).toBe("image");
  });

  it("should process image data", async () => {
    const result = await executeTool(imageToWebp, { input: SAMPLE_BASE64 });
    expect(result.success).toBe(true);
  });

  it("should reject empty input", async () => {
    const result = await executeTool(imageToWebp, { input: "  " });
    expect(result.success).toBe(false);
  });
});

describe("WebP to PNG", () => {
  it("should have correct metadata", () => {
    expect(webpToPng.meta.id).toBe("image/webp-to-png");
    expect(webpToPng.meta.category).toBe("image");
  });

  it("should process webp data", async () => {
    const result = await executeTool(webpToPng, { input: SAMPLE_BASE64 });
    expect(result.success).toBe(true);
  });

  it("should reject empty input", async () => {
    const result = await executeTool(webpToPng, { input: "  " });
    expect(result.success).toBe(false);
  });
});

describe("Image to Base64", () => {
  it("should have correct metadata", () => {
    expect(imageToBase64.meta.id).toBe("image/image-to-base64");
    expect(imageToBase64.meta.category).toBe("image");
  });

  it("should extract base64 from data URL", async () => {
    const result = await executeTool(imageToBase64, { input: SAMPLE_BASE64 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBeDefined();
    }
  });

  it("should handle raw base64 input", async () => {
    const result = await executeTool(imageToBase64, {
      input: SAMPLE_BASE64_RAW,
    });
    expect(result.success).toBe(true);
  });
});

describe("Base64 to Image", () => {
  it("should have correct metadata", () => {
    expect(base64ToImage.meta.id).toBe("image/base64-to-image");
    expect(base64ToImage.meta.category).toBe("image");
  });

  it("should convert base64 to data URL", async () => {
    const result = await executeTool(base64ToImage, {
      input: SAMPLE_BASE64_RAW,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "data:image/"
      );
    }
  });

  it("should support different MIME types", async () => {
    const result = await executeTool(
      base64ToImage,
      { input: SAMPLE_BASE64_RAW },
      { mimeType: "image/jpeg" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "image/jpeg"
      );
    }
  });
});

describe("Image to Data URL", () => {
  it("should have correct metadata", () => {
    expect(imageToDataUrl.meta.id).toBe("image/image-to-data-url");
    expect(imageToDataUrl.meta.category).toBe("image");
  });

  it("should process image data", async () => {
    const result = await executeTool(imageToDataUrl, { input: SAMPLE_BASE64 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBeDefined();
    }
  });
});

// ─── Image Editing ───────────────────────────────────────────────────

describe("Image Resizer", () => {
  it("should have correct metadata", () => {
    expect(imageResizer.meta.id).toBe("image/image-resizer");
    expect(imageResizer.meta.category).toBe("image");
  });

  it("should process resize request", async () => {
    const result = await executeTool(
      imageResizer,
      { input: SAMPLE_BASE64 },
      { width: 200, height: 150 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBeDefined();
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(imageResizer, { input: "  " });
    expect(result.success).toBe(false);
  });
});

describe("Image Cropper", () => {
  it("should have correct metadata", () => {
    expect(imageCropper.meta.id).toBe("image/image-cropper");
    expect(imageCropper.meta.category).toBe("image");
  });

  it("should process crop request", async () => {
    const result = await executeTool(
      imageCropper,
      { input: SAMPLE_BASE64 },
      { x: 0, y: 0, width: 50, height: 50 }
    );
    expect(result.success).toBe(true);
  });

  it("should reject empty input", async () => {
    const result = await executeTool(imageCropper, { input: "  " });
    expect(result.success).toBe(false);
  });
});

describe("Image Rotator", () => {
  it("should have correct metadata", () => {
    expect(imageRotator.meta.id).toBe("image/image-rotator");
    expect(imageRotator.meta.category).toBe("image");
  });

  it("should process rotation request", async () => {
    const result = await executeTool(
      imageRotator,
      { input: SAMPLE_BASE64 },
      { angle: 90 }
    );
    expect(result.success).toBe(true);
  });

  it("should reject empty input", async () => {
    const result = await executeTool(imageRotator, { input: "  " });
    expect(result.success).toBe(false);
  });
});

describe("Image Flipper", () => {
  it("should have correct metadata", () => {
    expect(imageFlipper.meta.id).toBe("image/image-flipper");
    expect(imageFlipper.meta.category).toBe("image");
  });

  it("should process horizontal flip", async () => {
    const result = await executeTool(
      imageFlipper,
      { input: SAMPLE_BASE64 },
      { direction: "horizontal" }
    );
    expect(result.success).toBe(true);
  });

  it("should process vertical flip", async () => {
    const result = await executeTool(
      imageFlipper,
      { input: SAMPLE_BASE64 },
      { direction: "vertical" }
    );
    expect(result.success).toBe(true);
  });

  it("should reject empty input", async () => {
    const result = await executeTool(imageFlipper, { input: "  " });
    expect(result.success).toBe(false);
  });
});

describe("Image Compressor", () => {
  it("should have correct metadata", () => {
    expect(imageCompressor.meta.id).toBe("image/image-compressor");
    expect(imageCompressor.meta.category).toBe("image");
  });

  it("should process compression request", async () => {
    const result = await executeTool(
      imageCompressor,
      { input: SAMPLE_BASE64 },
      { quality: 0.5 }
    );
    expect(result.success).toBe(true);
  });

  it("should reject empty input", async () => {
    const result = await executeTool(imageCompressor, { input: "  " });
    expect(result.success).toBe(false);
  });
});

describe("Aspect Ratio Calculator", () => {
  it("should have correct metadata", () => {
    expect(aspectRatioCalculator.meta.id).toBe("image/aspect-ratio-calculator");
    expect(aspectRatioCalculator.meta.category).toBe("image");
  });

  it("should calculate aspect ratio for standard dimensions", async () => {
    const result = await executeTool(aspectRatioCalculator, {
      width: 1920,
      height: 1080,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("16:9");
    }
  });

  it("should calculate target width from target height", async () => {
    const result = await executeTool(aspectRatioCalculator, {
      width: 1920,
      height: 1080,
      targetHeight: 720,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("1280");
    }
  });

  it("should calculate target height from target width", async () => {
    const result = await executeTool(aspectRatioCalculator, {
      width: 1920,
      height: 1080,
      targetWidth: 1280,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("720");
    }
  });

  it("should handle square aspect ratio", async () => {
    const result = await executeTool(aspectRatioCalculator, {
      width: 500,
      height: 500,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("1:1");
    }
  });
});

describe("Image Border Adder", () => {
  it("should have correct metadata", () => {
    expect(imageBorderAdder.meta.id).toBe("image/image-border-adder");
    expect(imageBorderAdder.meta.category).toBe("image");
  });

  it("should process border addition request", async () => {
    const result = await executeTool(
      imageBorderAdder,
      { input: SAMPLE_BASE64 },
      { borderWidth: 10, borderColor: "#ff0000" }
    );
    expect(result.success).toBe(true);
  });

  it("should reject empty input", async () => {
    const result = await executeTool(imageBorderAdder, { input: "  " });
    expect(result.success).toBe(false);
  });
});

describe("Image Watermark", () => {
  it("should have correct metadata", () => {
    expect(imageWatermark.meta.id).toBe("image/image-watermark");
    expect(imageWatermark.meta.category).toBe("image");
  });

  it("should process watermark request", async () => {
    const result = await executeTool(
      imageWatermark,
      { input: SAMPLE_BASE64 },
      { text: "DRAFT", position: "center" }
    );
    expect(result.success).toBe(true);
  });

  it("should reject empty input", async () => {
    const result = await executeTool(imageWatermark, { input: "  " });
    expect(result.success).toBe(false);
  });
});

describe("Round Corners", () => {
  it("should have correct metadata", () => {
    expect(roundCorners.meta.id).toBe("image/round-corners");
    expect(roundCorners.meta.category).toBe("image");
  });

  it("should process round corners request", async () => {
    const result = await executeTool(
      roundCorners,
      { input: SAMPLE_BASE64 },
      { radius: 20 }
    );
    expect(result.success).toBe(true);
  });

  it("should reject empty input", async () => {
    const result = await executeTool(roundCorners, { input: "  " });
    expect(result.success).toBe(false);
  });
});

describe("Circle Crop", () => {
  it("should have correct metadata", () => {
    expect(circleCrop.meta.id).toBe("image/circle-crop");
    expect(circleCrop.meta.category).toBe("image");
  });

  it("should process circle crop request", async () => {
    const result = await executeTool(circleCrop, { input: SAMPLE_BASE64 });
    expect(result.success).toBe(true);
  });

  it("should reject empty input", async () => {
    const result = await executeTool(circleCrop, { input: "  " });
    expect(result.success).toBe(false);
  });
});

describe("Thumbnail Generator", () => {
  it("should have correct metadata", () => {
    expect(thumbnailGenerator.meta.id).toBe("image/thumbnail-generator");
    expect(thumbnailGenerator.meta.category).toBe("image");
  });

  it("should process thumbnail generation request", async () => {
    const result = await executeTool(
      thumbnailGenerator,
      { input: SAMPLE_BASE64 },
      { maxWidth: 100, maxHeight: 100 }
    );
    expect(result.success).toBe(true);
  });

  it("should reject empty input", async () => {
    const result = await executeTool(thumbnailGenerator, { input: "  " });
    expect(result.success).toBe(false);
  });
});

describe("Image Splitter", () => {
  it("should have correct metadata", () => {
    expect(imageSplitter.meta.id).toBe("image/image-splitter");
    expect(imageSplitter.meta.category).toBe("image");
  });

  it("should process image split request", async () => {
    const result = await executeTool(
      imageSplitter,
      { input: SAMPLE_BASE64 },
      { rows: 2, cols: 2 }
    );
    expect(result.success).toBe(true);
  });

  it("should reject empty input", async () => {
    const result = await executeTool(imageSplitter, { input: "  " });
    expect(result.success).toBe(false);
  });
});

// ─── Image Effects ───────────────────────────────────────────────────

describe("Grayscale", () => {
  it("should have correct metadata", () => {
    expect(grayscale.meta.id).toBe("image/grayscale");
    expect(grayscale.meta.category).toBe("image");
  });

  it("should process grayscale conversion", async () => {
    const result = await executeTool(grayscale, { input: SAMPLE_BASE64 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBeDefined();
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(grayscale, { input: "  " });
    expect(result.success).toBe(false);
  });
});

describe("Sepia", () => {
  it("should have correct metadata", () => {
    expect(sepia.meta.id).toBe("image/sepia");
    expect(sepia.meta.category).toBe("image");
  });

  it("should process sepia filter", async () => {
    const result = await executeTool(
      sepia,
      { input: SAMPLE_BASE64 },
      { intensity: 0.8 }
    );
    expect(result.success).toBe(true);
  });

  it("should reject empty input", async () => {
    const result = await executeTool(sepia, { input: "  " });
    expect(result.success).toBe(false);
  });
});

describe("Invert Colors", () => {
  it("should have correct metadata", () => {
    expect(invertColors.meta.id).toBe("image/invert-colors");
    expect(invertColors.meta.category).toBe("image");
  });

  it("should process color inversion", async () => {
    const result = await executeTool(invertColors, { input: SAMPLE_BASE64 });
    expect(result.success).toBe(true);
  });

  it("should reject empty input", async () => {
    const result = await executeTool(invertColors, { input: "  " });
    expect(result.success).toBe(false);
  });
});

describe("Brightness Adjuster", () => {
  it("should have correct metadata", () => {
    expect(brightnessAdjuster.meta.id).toBe("image/brightness-adjuster");
    expect(brightnessAdjuster.meta.category).toBe("image");
  });

  it("should process brightness adjustment", async () => {
    const result = await executeTool(
      brightnessAdjuster,
      { input: SAMPLE_BASE64 },
      { brightness: 50 }
    );
    expect(result.success).toBe(true);
  });

  it("should reject empty input", async () => {
    const result = await executeTool(brightnessAdjuster, { input: "  " });
    expect(result.success).toBe(false);
  });
});

describe("Contrast Adjuster", () => {
  it("should have correct metadata", () => {
    expect(contrastAdjuster.meta.id).toBe("image/contrast-adjuster");
    expect(contrastAdjuster.meta.category).toBe("image");
  });

  it("should process contrast adjustment", async () => {
    const result = await executeTool(
      contrastAdjuster,
      { input: SAMPLE_BASE64 },
      { contrast: 30 }
    );
    expect(result.success).toBe(true);
  });

  it("should reject empty input", async () => {
    const result = await executeTool(contrastAdjuster, { input: "  " });
    expect(result.success).toBe(false);
  });
});

describe("Blur Filter", () => {
  it("should have correct metadata", () => {
    expect(blurFilter.meta.id).toBe("image/blur-filter");
    expect(blurFilter.meta.category).toBe("image");
  });

  it("should process blur filter", async () => {
    const result = await executeTool(
      blurFilter,
      { input: SAMPLE_BASE64 },
      { radius: 5 }
    );
    expect(result.success).toBe(true);
  });

  it("should reject empty input", async () => {
    const result = await executeTool(blurFilter, { input: "  " });
    expect(result.success).toBe(false);
  });
});

describe("Sharpen Filter", () => {
  it("should have correct metadata", () => {
    expect(sharpenFilter.meta.id).toBe("image/sharpen-filter");
    expect(sharpenFilter.meta.category).toBe("image");
  });

  it("should process sharpen filter", async () => {
    const result = await executeTool(
      sharpenFilter,
      { input: SAMPLE_BASE64 },
      { amount: 2 }
    );
    expect(result.success).toBe(true);
  });

  it("should reject empty input", async () => {
    const result = await executeTool(sharpenFilter, { input: "  " });
    expect(result.success).toBe(false);
  });
});

describe("Pixelate", () => {
  it("should have correct metadata", () => {
    expect(pixelate.meta.id).toBe("image/pixelate");
    expect(pixelate.meta.category).toBe("image");
  });

  it("should process pixelation", async () => {
    const result = await executeTool(
      pixelate,
      { input: SAMPLE_BASE64 },
      { blockSize: 10 }
    );
    expect(result.success).toBe(true);
  });

  it("should reject empty input", async () => {
    const result = await executeTool(pixelate, { input: "  " });
    expect(result.success).toBe(false);
  });
});

describe("Posterize", () => {
  it("should have correct metadata", () => {
    expect(posterize.meta.id).toBe("image/posterize");
    expect(posterize.meta.category).toBe("image");
  });

  it("should process posterization", async () => {
    const result = await executeTool(
      posterize,
      { input: SAMPLE_BASE64 },
      { levels: 4 }
    );
    expect(result.success).toBe(true);
  });

  it("should reject empty input", async () => {
    const result = await executeTool(posterize, { input: "  " });
    expect(result.success).toBe(false);
  });
});

describe("Duotone", () => {
  it("should have correct metadata", () => {
    expect(duotone.meta.id).toBe("image/duotone");
    expect(duotone.meta.category).toBe("image");
  });

  it("should process duotone filter", async () => {
    const result = await executeTool(
      duotone,
      { input: SAMPLE_BASE64 },
      { darkColor: "#000033", lightColor: "#ff6600" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBeDefined();
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(duotone, { input: "  " });
    expect(result.success).toBe(false);
  });
});

// ─── Image Analysis ──────────────────────────────────────────────────

describe("Image Info", () => {
  it("should have correct metadata", () => {
    expect(imageInfo.meta.id).toBe("image/image-info");
    expect(imageInfo.meta.category).toBe("image");
  });

  it("should extract info from data URL", async () => {
    const result = await executeTool(imageInfo, { input: SAMPLE_BASE64 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Image Info"
      );
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(imageInfo, { input: "  " });
    expect(result.success).toBe(false);
  });
});

describe("EXIF Reader", () => {
  it("should have correct metadata", () => {
    expect(exifReader.meta.id).toBe("image/exif-reader");
    expect(exifReader.meta.category).toBe("image");
  });

  it("should process EXIF read request", async () => {
    const result = await executeTool(exifReader, { input: SAMPLE_BASE64 });
    expect(result.success).toBe(true);
  });

  it("should reject empty input", async () => {
    const result = await executeTool(exifReader, { input: "  " });
    expect(result.success).toBe(false);
  });
});

describe("EXIF Remover", () => {
  it("should have correct metadata", () => {
    expect(exifRemover.meta.id).toBe("image/exif-remover");
    expect(exifRemover.meta.category).toBe("image");
  });

  it("should strip EXIF data from JPEG", async () => {
    // Minimal JPEG with an APP1 (EXIF) segment:
    // SOI (FFD8) + APP1 marker (FFE1) + length (0008) + "Exif\0\0" + DQT + SOF + SOS stub + EOI
    const jpegBytes = new Uint8Array([
      0xff,
      0xd8, // SOI
      0xff,
      0xe1,
      0x00,
      0x08,
      0x45,
      0x78,
      0x69,
      0x66,
      0x00,
      0x00, // APP1 (EXIF) - 8 byte segment
      0xff,
      0xdb,
      0x00,
      0x05,
      0x00,
      0x01,
      0x01, // DQT segment (keep)
      0xff,
      0xd9, // EOI
    ]);
    let binary = "";
    for (const b of jpegBytes) {
      binary += String.fromCharCode(b);
    }
    const base64 = btoa(binary);
    const result = await executeTool(exifRemover, {
      input: `data:image/jpeg;base64,${base64}`,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = String((result.data as Record<string, unknown>).output);
      expect(output).toContain("data:image/jpeg;base64,");
      // Decode the output and verify APP1 was stripped
      const outBase64 = output.replace("data:image/jpeg;base64,", "");
      const outBinary = atob(outBase64);
      const outBytes = new Uint8Array(outBinary.length);
      for (let i = 0; i < outBinary.length; i++) {
        outBytes[i] = outBinary.charCodeAt(i);
      }
      // Should still have SOI
      expect(outBytes[0]).toBe(0xff);
      expect(outBytes[1]).toBe(0xd8);
      // Should NOT contain APP1 marker (FFE1) -- the EXIF should be stripped
      let hasApp1 = false;
      for (let i = 2; i < outBytes.length - 1; i++) {
        if (outBytes[i] === 0xff && outBytes[i + 1] === 0xe1) {
          hasApp1 = true;
          break;
        }
      }
      expect(hasApp1).toBe(false);
      // Should still have DQT
      let hasDqt = false;
      for (let i = 0; i < outBytes.length - 1; i++) {
        if (outBytes[i] === 0xff && outBytes[i + 1] === 0xdb) {
          hasDqt = true;
          break;
        }
      }
      expect(hasDqt).toBe(true);
    }
  });

  it("should strip metadata from PNG", async () => {
    // Minimal PNG with a tEXt chunk that should be stripped
    // PNG signature + IHDR + tEXt + IEND
    const pngSig = [137, 80, 78, 71, 13, 10, 26, 10];
    // IHDR chunk (13 bytes data): width=1, height=1, bit depth=8, color type=2
    const ihdrData = [
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00,
      0x00,
    ];
    const ihdrLen = [0x00, 0x00, 0x00, 0x0d];
    const ihdrType = [0x49, 0x48, 0x44, 0x52]; // IHDR
    const ihdrCrc = [0x90, 0x77, 0x53, 0xde]; // CRC for this IHDR (pre-computed)
    // tEXt chunk: keyword "Comment" + null + value "test"
    const textData = [
      0x43, 0x6f, 0x6d, 0x6d, 0x65, 0x6e, 0x74, 0x00, 0x74, 0x65, 0x73, 0x74,
    ];
    const textLen = [0x00, 0x00, 0x00, 0x0c];
    const textType = [0x74, 0x45, 0x58, 0x74]; // tEXt
    const textCrc = [0x00, 0x00, 0x00, 0x00]; // placeholder CRC
    // IEND chunk
    const iendLen = [0x00, 0x00, 0x00, 0x00];
    const iendType = [0x49, 0x45, 0x4e, 0x44]; // IEND
    const iendCrc = [0xae, 0x42, 0x60, 0x82]; // standard IEND CRC
    const pngBytes = new Uint8Array([
      ...pngSig,
      ...ihdrLen,
      ...ihdrType,
      ...ihdrData,
      ...ihdrCrc,
      ...textLen,
      ...textType,
      ...textData,
      ...textCrc,
      ...iendLen,
      ...iendType,
      ...iendCrc,
    ]);
    let binary = "";
    for (const b of pngBytes) {
      binary += String.fromCharCode(b);
    }
    const base64 = btoa(binary);
    const result = await executeTool(exifRemover, {
      input: `data:image/png;base64,${base64}`,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = String((result.data as Record<string, unknown>).output);
      expect(output).toContain("data:image/png;base64,");
      // Decode and verify tEXt was stripped
      const outBase64 = output.replace("data:image/png;base64,", "");
      const outBinary = atob(outBase64);
      // Should not contain "tEXt" chunk type
      expect(outBinary).not.toContain("tEXt");
      // Should still contain IHDR and IEND
      expect(outBinary).toContain("IHDR");
      expect(outBinary).toContain("IEND");
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(exifRemover, { input: "  " });
    expect(result.success).toBe(false);
  });

  it("should reject unsupported image formats", async () => {
    const result = await executeTool(exifRemover, { input: "randomdata123" });
    expect(result.success).toBe(false);
  });
});

describe("Color Picker From Image", () => {
  it("should have correct metadata", () => {
    expect(colorPickerFromImage.meta.id).toBe("image/color-picker-from-image");
    expect(colorPickerFromImage.meta.category).toBe("image");
  });

  it("should process color picker request", async () => {
    const result = await executeTool(colorPickerFromImage, {
      input: SAMPLE_BASE64,
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty input", async () => {
    const result = await executeTool(colorPickerFromImage, { input: "  " });
    expect(result.success).toBe(false);
  });
});

describe("Dominant Colors", () => {
  it("should have correct metadata", () => {
    expect(dominantColors.meta.id).toBe("image/dominant-colors");
    expect(dominantColors.meta.category).toBe("image");
  });

  it("should process dominant color extraction", async () => {
    const result = await executeTool(
      dominantColors,
      { input: SAMPLE_BASE64 },
      { count: 5 }
    );
    expect(result.success).toBe(true);
  });

  it("should reject empty input", async () => {
    const result = await executeTool(dominantColors, { input: "  " });
    expect(result.success).toBe(false);
  });
});

describe("Image Histogram", () => {
  it("should have correct metadata", () => {
    expect(imageHistogram.meta.id).toBe("image/image-histogram");
    expect(imageHistogram.meta.category).toBe("image");
  });

  it("should process histogram request", async () => {
    const result = await executeTool(imageHistogram, { input: SAMPLE_BASE64 });
    expect(result.success).toBe(true);
  });

  it("should reject empty input", async () => {
    const result = await executeTool(imageHistogram, { input: "  " });
    expect(result.success).toBe(false);
  });
});

describe("Image Diff", () => {
  it("should have correct metadata", () => {
    expect(imageDiff.meta.id).toBe("image/image-diff");
    expect(imageDiff.meta.category).toBe("image");
  });

  it("should compare two images", async () => {
    const result = await executeTool(imageDiff, {
      input1: SAMPLE_BASE64,
      input2: SAMPLE_BASE64,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).original).toBeDefined();
      expect((result.data as Record<string, unknown>).modified).toBeDefined();
    }
  });

  it("should reject if one input is empty", async () => {
    const result = await executeTool(imageDiff, {
      input1: SAMPLE_BASE64,
      input2: "  ",
    });
    expect(result.success).toBe(false);
  });

  it("should reject if both inputs are empty", async () => {
    const result = await executeTool(imageDiff, {
      input1: "  ",
      input2: "  ",
    });
    expect(result.success).toBe(false);
  });
});

// ─── Placeholder Image ──────────────────────────────────────────────

describe("Placeholder Image", () => {
  it("should have correct metadata", () => {
    expect(placeholderImage.meta.id).toBe("image/placeholder-image");
    expect(placeholderImage.meta.category).toBe("image");
  });

  it("should generate SVG placeholder with default dimensions", async () => {
    const result = await executeTool(placeholderImage, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
      expect((result.data as Record<string, unknown>).output).toContain(
        "300x200"
      );
    }
  });

  it("should generate SVG placeholder with custom dimensions", async () => {
    const result = await executeTool(placeholderImage, {
      width: 800,
      height: 600,
      text: "Hero Image",
      backgroundColor: "#336699",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("<svg");
      expect((result.data as Record<string, unknown>).output).toContain(
        "Hero Image"
      );
    }
  });

  it("should generate URL format output", async () => {
    const result = await executeTool(placeholderImage, {
      width: 400,
      height: 300,
      format: "url",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "placeholder.com"
      );
    }
  });
});
