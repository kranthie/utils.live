/**
 * Canvas utility helpers for image processing tools.
 *
 * These tools are CLIENT tier and execute in the browser where Canvas API
 * is available. When running in Node.js (e.g., tests), they gracefully
 * degrade by returning the input unchanged.
 */

/**
 * Check if Canvas API is available in the current environment.
 */
export function isCanvasAvailable(): boolean {
  return (
    typeof OffscreenCanvas !== "undefined" ||
    (typeof document !== "undefined" &&
      typeof document.createElement === "function")
  );
}

/**
 * Create a canvas element of the given dimensions.
 */
export function createCanvas(
  width: number,
  height: number
): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  throw new Error("Canvas API is not available in this environment");
}

/**
 * Get 2D rendering context from a canvas.
 */
export function getContext(
  canvas: OffscreenCanvas | HTMLCanvasElement
): OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2D rendering context");
  return ctx as OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
}

/**
 * Export canvas to a data URL string.
 */
export function canvasToDataUrl(
  canvas: OffscreenCanvas | HTMLCanvasElement,
  mimeType: string = "image/png",
  quality?: number
): Promise<string> {
  if (canvas instanceof HTMLCanvasElement) {
    return Promise.resolve(canvas.toDataURL(mimeType, quality));
  }
  // OffscreenCanvas path
  const options: ImageEncodeOptions = { type: mimeType };
  if (quality !== undefined) {
    options.quality = quality;
  }
  return canvas.convertToBlob(options).then((blob) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  });
}

/**
 * Load an image data URL into an ImageBitmap or HTMLImageElement.
 * Returns the image and its natural dimensions.
 */
export async function loadImage(
  dataUrl: string
): Promise<{
  image: ImageBitmap | HTMLImageElement;
  width: number;
  height: number;
}> {
  // Try createImageBitmap first (works in modern browsers and workers)
  if (
    typeof createImageBitmap !== "undefined" &&
    typeof fetch !== "undefined"
  ) {
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const bmp = await createImageBitmap(blob);
      return { image: bmp, width: bmp.width, height: bmp.height };
    } catch {
      // Fall through to Image() approach
    }
  }

  // Fallback to HTMLImageElement
  if (typeof Image !== "undefined") {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () =>
        resolve({
          image: img,
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = dataUrl;
    });
  }

  throw new Error("No image loading API available");
}

/**
 * Ensure input is a valid data URL. If it's raw base64, wrap it.
 */
export function ensureDataUrl(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith("data:")) return trimmed;
  // Assume PNG for raw base64
  return `data:image/png;base64,${trimmed}`;
}

/**
 * Extract MIME type from a data URL.
 */
export function getMimeType(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;]+);/);
  return match ? match[1]! : "image/png";
}

/**
 * Load image onto a canvas and return the canvas and context.
 * This is the core helper for most image processing tools.
 */
export async function loadImageToCanvas(dataUrl: string): Promise<{
  canvas: OffscreenCanvas | HTMLCanvasElement;
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
  width: number;
  height: number;
}> {
  const { image, width, height } = await loadImage(dataUrl);
  const canvas = createCanvas(width, height);
  const ctx = getContext(canvas);
  ctx.drawImage(image as CanvasImageSource, 0, 0);
  return { canvas, ctx, width, height };
}

/**
 * Parse a hex color string to RGB values.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace("#", "");
  const num = parseInt(cleaned, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}
