"use client";

import { useState, useCallback, useMemo } from "react";
import { Pipette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyButton } from "@/components/shared/copy-button";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  /**
   * Initial color value
   */
  value?: string;
  /**
   * Callback when color changes
   */
  onChange?: (color: string) => void;
  /**
   * Whether to show alpha slider
   * @default true
   */
  showAlpha?: boolean;
  /**
   * Whether to show format tabs (HEX, RGB, HSL)
   * @default true
   */
  showFormats?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1]!, 16),
        g: parseInt(result[2]!, 16),
        b: parseInt(result[3]!, 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToRgb(h: number, s: number, l: number): RGB {
  h /= 360;
  s /= 100;
  l /= 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

export function ColorPicker({
  value = "#3B82F6",
  onChange,
  showAlpha = true,
  showFormats = true,
  className,
}: ColorPickerProps): React.ReactElement {
  const [alpha, setAlpha] = useState(100);

  // Parse initial color
  const rgb = useMemo(() => hexToRgb(value), [value]);
  const hsl = useMemo(() => rgbToHsl(rgb.r, rgb.g, rgb.b), [rgb]);

  const [localHsl, setLocalHsl] = useState<HSL>(hsl);

  const currentRgb = useMemo(
    () => hslToRgb(localHsl.h, localHsl.s, localHsl.l),
    [localHsl]
  );
  const currentHex = useMemo(
    () => rgbToHex(currentRgb.r, currentRgb.g, currentRgb.b),
    [currentRgb]
  );

  const updateColor = useCallback(
    (newHsl: HSL) => {
      setLocalHsl(newHsl);
      const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
      const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
      onChange?.(newHex);
    },
    [onChange]
  );

  const handleHexInput = (hex: string): void => {
    if (/^#?[0-9A-Fa-f]{6}$/.test(hex)) {
      const normalizedHex = hex.startsWith("#") ? hex : `#${hex}`;
      const newRgb = hexToRgb(normalizedHex);
      const newHsl = rgbToHsl(newRgb.r, newRgb.g, newRgb.b);
      setLocalHsl(newHsl);
      onChange?.(normalizedHex);
    }
  };

  // Format outputs
  const hexOutput = currentHex.toUpperCase();
  const rgbOutput =
    alpha < 100
      ? `rgba(${currentRgb.r}, ${currentRgb.g}, ${currentRgb.b}, ${alpha / 100})`
      : `rgb(${currentRgb.r}, ${currentRgb.g}, ${currentRgb.b})`;
  const hslOutput =
    alpha < 100
      ? `hsla(${localHsl.h}, ${localHsl.s}%, ${localHsl.l}%, ${alpha / 100})`
      : `hsl(${localHsl.h}, ${localHsl.s}%, ${localHsl.l}%)`;

  return (
    <div className={cn("w-full max-w-sm space-y-4", className)}>
      {/* Color preview and saturation/lightness picker */}
      <div className="relative">
        {/* Saturation/Lightness picker */}
        <div
          className="relative h-40 cursor-crosshair overflow-hidden rounded-lg"
          style={{
            background: `linear-gradient(to bottom, transparent, black),
                         linear-gradient(to right, white, hsl(${localHsl.h}, 100%, 50%))`,
          }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = Math.max(
              0,
              Math.min(1, (e.clientX - rect.left) / rect.width)
            );
            const y = Math.max(
              0,
              Math.min(1, (e.clientY - rect.top) / rect.height)
            );
            const newS = Math.round(x * 100);
            const newL = Math.round((1 - y) * 50);
            updateColor({ ...localHsl, s: newS, l: newL });
          }}
        >
          {/* Picker indicator */}
          <div
            className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 transform rounded-full border-2 border-white shadow-md"
            style={{
              left: `${localHsl.s}%`,
              top: `${100 - localHsl.l * 2}%`,
              backgroundColor: currentHex,
            }}
          />
        </div>
      </div>

      {/* Hue slider */}
      <div className="space-y-2">
        <Label className="text-sm">Hue</Label>
        <div
          className="h-3 rounded-full"
          style={{
            background: `linear-gradient(to right,
              hsl(0, 100%, 50%),
              hsl(60, 100%, 50%),
              hsl(120, 100%, 50%),
              hsl(180, 100%, 50%),
              hsl(240, 100%, 50%),
              hsl(300, 100%, 50%),
              hsl(360, 100%, 50%))`,
          }}
        >
          <Slider
            value={[localHsl.h]}
            onValueChange={([h]) => updateColor({ ...localHsl, h: h! })}
            max={360}
            step={1}
            className="[&_[role=slider]]:border-2 [&_[role=slider]]:border-gray-300 [&_[role=slider]]:bg-white"
          />
        </div>
      </div>

      {/* Alpha slider */}
      {showAlpha && (
        <div className="space-y-2">
          <Label className="text-sm">Alpha</Label>
          <div
            className="h-3 rounded-full"
            style={{
              background: `linear-gradient(to right, transparent, ${currentHex}),
                repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 10px 10px`,
            }}
          >
            <Slider
              value={[alpha]}
              onValueChange={([a]) => setAlpha(a!)}
              max={100}
              step={1}
              className="[&_[role=slider]]:border-2 [&_[role=slider]]:border-gray-300 [&_[role=slider]]:bg-white"
            />
          </div>
        </div>
      )}

      {/* Preview swatch */}
      <div className="flex items-center gap-4">
        <div
          className="h-12 w-12 rounded-lg border shadow-xs"
          style={{
            backgroundColor: currentHex,
            opacity: alpha / 100,
          }}
        />
        <div className="flex-1">
          <Input
            value={hexOutput}
            onChange={(e) => handleHexInput(e.target.value)}
            className="font-mono text-sm"
            placeholder="#000000"
          />
        </div>
      </div>

      {/* Format tabs */}
      {showFormats && (
        <Tabs defaultValue="hex" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hex">HEX</TabsTrigger>
            <TabsTrigger value="rgb">RGB</TabsTrigger>
            <TabsTrigger value="hsl">HSL</TabsTrigger>
          </TabsList>
          <TabsContent value="hex" className="mt-2">
            <div className="flex items-center gap-2">
              <Input value={hexOutput} readOnly className="font-mono text-sm" />
              <CopyButton value={hexOutput} size="sm" />
            </div>
          </TabsContent>
          <TabsContent value="rgb" className="mt-2">
            <div className="flex items-center gap-2">
              <Input value={rgbOutput} readOnly className="font-mono text-sm" />
              <CopyButton value={rgbOutput} size="sm" />
            </div>
          </TabsContent>
          <TabsContent value="hsl" className="mt-2">
            <div className="flex items-center gap-2">
              <Input value={hslOutput} readOnly className="font-mono text-sm" />
              <CopyButton value={hslOutput} size="sm" />
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Eyedropper (if supported) */}
      {typeof window !== "undefined" && window.EyeDropper && (
        <Button
          variant="outline"
          className="w-full"
          onClick={(): void => {
            void (async (): Promise<void> => {
              try {
                if (window.EyeDropper) {
                  const eyeDropper = new window.EyeDropper();
                  const result = await eyeDropper.open();
                  handleHexInput(result.sRGBHex);
                }
              } catch {
                // User cancelled or not supported
              }
            })();
          }}
        >
          <Pipette className="mr-2 h-4 w-4" />
          Pick color from screen
        </Button>
      )}
    </div>
  );
}
