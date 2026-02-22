/**
 * EyeDropper API types (experimental browser API)
 * @see https://developer.mozilla.org/en-US/docs/Web/API/EyeDropper_API
 */

interface EyeDropperResult {
  sRGBHex: string;
}

interface EyeDropper {
  open(): Promise<EyeDropperResult>;
}

interface EyeDropperConstructor {
  new (): EyeDropper;
}

declare global {
  interface Window {
    EyeDropper?: EyeDropperConstructor;
  }
}

export {};
