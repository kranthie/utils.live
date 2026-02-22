"use client";

import { useMemo } from "react";
import { CopyButton } from "@/components/shared/copy-button";
import { cn } from "@/lib/utils";

interface ColorSwatchProps {
  /**
   * Color value (hex, rgb, hsl, or named color)
   */
  color: string;
  /**
   * Size of the swatch
   * @default "md"
   */
  size?: "sm" | "md" | "lg";
  /**
   * Whether to show the color value
   * @default true
   */
  showValue?: boolean;
  /**
   * Whether to show copy button
   * @default true
   */
  showCopy?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

interface ColorInfo {
  hex: string;
  rgb: string;
  hsl: string;
}

function parseColor(color: string): ColorInfo | null {
  // Create a temporary element to compute the color
  if (typeof window === "undefined") {
    return { hex: color, rgb: color, hsl: color };
  }

  const el = document.createElement("div");
  el.style.color = color;
  document.body.appendChild(el);
  const computedColor = getComputedStyle(el).color;
  document.body.removeChild(el);

  // Parse RGB from computed color
  const rgbMatch = computedColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!rgbMatch) return null;

  const r = parseInt(rgbMatch[1]!, 10);
  const g = parseInt(rgbMatch[2]!, 10);
  const b = parseInt(rgbMatch[3]!, 10);

  // Convert to hex
  const hex = `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;

  // Convert to HSL
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case rNorm:
        h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
        break;
      case gNorm:
        h = ((bNorm - rNorm) / d + 2) / 6;
        break;
      case bNorm:
        h = ((rNorm - gNorm) / d + 4) / 6;
        break;
    }
  }

  const hsl = `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;

  return {
    hex: hex.toUpperCase(),
    rgb: `rgb(${r}, ${g}, ${b})`,
    hsl,
  };
}

function getContrastColor(color: string): "white" | "black" {
  // Create a temporary element to compute the color
  if (typeof window === "undefined") {
    return "black";
  }

  const el = document.createElement("div");
  el.style.color = color;
  document.body.appendChild(el);
  const computedColor = getComputedStyle(el).color;
  document.body.removeChild(el);

  const rgbMatch = computedColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!rgbMatch) return "black";

  const r = parseInt(rgbMatch[1]!, 10);
  const g = parseInt(rgbMatch[2]!, 10);
  const b = parseInt(rgbMatch[3]!, 10);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? "black" : "white";
}

const sizeClasses = {
  sm: "w-12 h-12",
  md: "w-20 h-20",
  lg: "w-32 h-32",
};

export function ColorSwatch({
  color,
  size = "md",
  showValue = true,
  showCopy = true,
  className,
}: ColorSwatchProps): React.ReactElement {
  const colorInfo = useMemo(() => parseColor(color), [color]);
  const contrastColor = useMemo(() => getContrastColor(color), [color]);

  return (
    <div className={cn("inline-flex flex-col items-center gap-2", className)}>
      {/* Swatch */}
      <div
        role={showCopy && colorInfo ? "button" : undefined}
        tabIndex={showCopy && colorInfo ? 0 : undefined}
        aria-label={
          showCopy && colorInfo ? `Copy color ${colorInfo.hex}` : undefined
        }
        className={cn(
          "group relative flex items-center justify-center rounded-lg border shadow-xs",
          showCopy &&
            colorInfo &&
            "focus:ring-ring cursor-pointer focus:ring-2 focus:ring-offset-2 focus:outline-hidden",
          sizeClasses[size]
        )}
        style={{ backgroundColor: color }}
        onKeyDown={
          showCopy && colorInfo
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  void navigator.clipboard.writeText(colorInfo.hex);
                }
              }
            : undefined
        }
      >
        {showCopy && colorInfo && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
            <CopyButton
              value={colorInfo.hex}
              size="sm"
              className={
                contrastColor === "white" ? "text-white" : "text-black"
              }
            />
          </div>
        )}
      </div>

      {/* Color values */}
      {showValue && colorInfo && (
        <div className="space-y-0.5 text-center">
          <div className="font-mono text-sm font-medium">{colorInfo.hex}</div>
          <div className="text-muted-foreground font-mono text-xs">
            {colorInfo.rgb}
          </div>
          <div className="text-muted-foreground font-mono text-xs">
            {colorInfo.hsl}
          </div>
        </div>
      )}
    </div>
  );
}

interface ColorPaletteProps {
  /**
   * Array of colors to display
   */
  colors: string[];
  /**
   * Size of each swatch
   * @default "sm"
   */
  size?: "sm" | "md" | "lg";
  /**
   * Whether to show color values
   * @default false
   */
  showValues?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function ColorPalette({
  colors,
  size = "sm",
  showValues = false,
  className,
}: ColorPaletteProps): React.ReactElement {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {colors.map((color, index) => (
        <ColorSwatch
          key={`${color}-${index}`}
          color={color}
          size={size}
          showValue={showValues}
          showCopy={true}
        />
      ))}
    </div>
  );
}
