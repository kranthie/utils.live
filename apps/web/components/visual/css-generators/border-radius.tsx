"use client";

import { useState, useMemo } from "react";
import { Link2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CopyButton } from "@/components/shared/copy-button";
import { cn } from "@/lib/utils";

type Unit = "px" | "%" | "em" | "rem";

interface BorderRadiusGeneratorProps {
  /**
   * Callback when border-radius CSS changes
   */
  onChange?: (css: string) => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const PRESETS = [
  { name: "None", values: [0, 0, 0, 0] },
  { name: "Small", values: [4, 4, 4, 4] },
  { name: "Medium", values: [8, 8, 8, 8] },
  { name: "Large", values: [16, 16, 16, 16] },
  { name: "Pill", values: [999, 999, 999, 999] },
  { name: "Top", values: [16, 16, 0, 0] },
  { name: "Bottom", values: [0, 0, 16, 16] },
  { name: "Left", values: [16, 0, 0, 16] },
  { name: "Right", values: [0, 16, 16, 0] },
  { name: "Blob", values: [30, 70, 70, 30] },
];

export function BorderRadiusGenerator({
  onChange,
  className,
}: BorderRadiusGeneratorProps): React.ReactElement {
  const [topLeft, setTopLeft] = useState(8);
  const [topRight, setTopRight] = useState(8);
  const [bottomRight, setBottomRight] = useState(8);
  const [bottomLeft, setBottomLeft] = useState(8);
  const [linked, setLinked] = useState(true);
  const [unit, setUnit] = useState<Unit>("px");
  const [previewSize, setPreviewSize] = useState(120);

  const borderRadiusCss = useMemo(() => {
    const values = [topLeft, topRight, bottomRight, bottomLeft];
    const allSame = values.every((v) => v === values[0]);
    const topBottomSame = topLeft === topRight && bottomLeft === bottomRight;
    const sideSame = topLeft === bottomLeft && topRight === bottomRight;

    if (allSame) {
      return `${topLeft}${unit}`;
    }
    if (topBottomSame && sideSame) {
      return `${topLeft}${unit} ${topRight}${unit}`;
    }
    if (topBottomSame) {
      return `${topLeft}${unit} ${topRight}${unit} ${bottomRight}${unit}`;
    }
    return `${topLeft}${unit} ${topRight}${unit} ${bottomRight}${unit} ${bottomLeft}${unit}`;
  }, [topLeft, topRight, bottomRight, bottomLeft, unit]);

  const updateRadius = (
    corner: "tl" | "tr" | "br" | "bl",
    value: number
  ): void => {
    if (linked) {
      setTopLeft(value);
      setTopRight(value);
      setBottomRight(value);
      setBottomLeft(value);
    } else {
      switch (corner) {
        case "tl":
          setTopLeft(value);
          break;
        case "tr":
          setTopRight(value);
          break;
        case "br":
          setBottomRight(value);
          break;
        case "bl":
          setBottomLeft(value);
          break;
      }
    }
  };

  const applyPreset = (preset: (typeof PRESETS)[0]): void => {
    setTopLeft(preset.values[0]!);
    setTopRight(preset.values[1]!);
    setBottomRight(preset.values[2]!);
    setBottomLeft(preset.values[3]!);
    setLinked(preset.values.every((v) => v === preset.values[0]));
  };

  // Notify parent of changes
  useMemo(() => {
    onChange?.(`border-radius: ${borderRadiusCss};`);
  }, [borderRadiusCss, onChange]);

  return (
    <div className={cn("w-full max-w-lg space-y-6", className)}>
      {/* Preview */}
      <div className="bg-muted flex h-48 items-center justify-center rounded-lg">
        <div
          className="bg-primary"
          style={{
            width: previewSize,
            height: previewSize,
            borderRadius: borderRadiusCss,
          }}
        />
      </div>

      {/* Preview size */}
      <div className="flex items-center gap-4">
        <Label className="text-sm whitespace-nowrap">Preview Size</Label>
        <Slider
          value={[previewSize]}
          onValueChange={([v]) => setPreviewSize(v!)}
          min={40}
          max={180}
          step={1}
        />
        <span className="w-12 text-right text-sm">{previewSize}px</span>
      </div>

      {/* Unit selector */}
      <div className="flex items-center gap-4">
        <Label className="text-sm">Unit</Label>
        <Select value={unit} onValueChange={(v) => setUnit(v as Unit)}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="px">px</SelectItem>
            <SelectItem value="%">%</SelectItem>
            <SelectItem value="em">em</SelectItem>
            <SelectItem value="rem">rem</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={linked ? "default" : "outline"}
          size="sm"
          onClick={() => setLinked(!linked)}
          className="ml-auto"
        >
          {linked ? (
            <Link2 className="mr-2 h-4 w-4" />
          ) : (
            <Unlink className="mr-2 h-4 w-4" />
          )}
          {linked ? "Linked" : "Unlinked"}
        </Button>
      </div>

      {/* Corner controls */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">Top Left</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[topLeft]}
              onValueChange={([v]) => updateRadius("tl", v!)}
              min={0}
              max={unit === "%" ? 50 : 100}
              step={1}
            />
            <span className="w-14 text-right text-sm">
              {topLeft}
              {unit}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Top Right</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[topRight]}
              onValueChange={([v]) => updateRadius("tr", v!)}
              min={0}
              max={unit === "%" ? 50 : 100}
              step={1}
              disabled={linked}
            />
            <span className="w-14 text-right text-sm">
              {topRight}
              {unit}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Bottom Left</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[bottomLeft]}
              onValueChange={([v]) => updateRadius("bl", v!)}
              min={0}
              max={unit === "%" ? 50 : 100}
              step={1}
              disabled={linked}
            />
            <span className="w-14 text-right text-sm">
              {bottomLeft}
              {unit}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Bottom Right</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[bottomRight]}
              onValueChange={([v]) => updateRadius("br", v!)}
              min={0}
              max={unit === "%" ? 50 : 100}
              step={1}
              disabled={linked}
            />
            <span className="w-14 text-right text-sm">
              {bottomRight}
              {unit}
            </span>
          </div>
        </div>
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <Label className="text-sm">Presets</Label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset.name}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(preset)}
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </div>

      {/* CSS Output */}
      <div className="space-y-2">
        <Label className="text-sm">CSS</Label>
        <div className="flex items-center gap-2">
          <Input
            value={`border-radius: ${borderRadiusCss};`}
            readOnly
            className="font-mono text-sm"
          />
          <CopyButton value={`border-radius: ${borderRadiusCss};`} size="sm" />
        </div>
      </div>
    </div>
  );
}
