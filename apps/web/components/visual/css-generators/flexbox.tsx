"use client";

import { useState, useMemo } from "react";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { CopyButton } from "@/components/shared/copy-button";
import { cn } from "@/lib/utils";

type FlexDirection = "row" | "row-reverse" | "column" | "column-reverse";
type FlexWrap = "nowrap" | "wrap" | "wrap-reverse";
type JustifyContent =
  | "flex-start"
  | "flex-end"
  | "center"
  | "space-between"
  | "space-around"
  | "space-evenly";
type AlignItems = "flex-start" | "flex-end" | "center" | "stretch" | "baseline";
type AlignContent =
  | "flex-start"
  | "flex-end"
  | "center"
  | "space-between"
  | "space-around"
  | "stretch";

interface FlexboxGeneratorProps {
  /**
   * Callback when flexbox CSS changes
   */
  onChange?: (css: string) => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const PRESETS = [
  {
    name: "Center",
    direction: "row" as FlexDirection,
    justify: "center" as JustifyContent,
    align: "center" as AlignItems,
  },
  {
    name: "Space Between",
    direction: "row" as FlexDirection,
    justify: "space-between" as JustifyContent,
    align: "center" as AlignItems,
  },
  {
    name: "Column Center",
    direction: "column" as FlexDirection,
    justify: "center" as JustifyContent,
    align: "center" as AlignItems,
  },
  {
    name: "Start",
    direction: "row" as FlexDirection,
    justify: "flex-start" as JustifyContent,
    align: "flex-start" as AlignItems,
  },
  {
    name: "End",
    direction: "row" as FlexDirection,
    justify: "flex-end" as JustifyContent,
    align: "flex-end" as AlignItems,
  },
];

export function FlexboxGenerator({
  onChange,
  className,
}: FlexboxGeneratorProps): React.ReactElement {
  const [direction, setDirection] = useState<FlexDirection>("row");
  const [wrap, setWrap] = useState<FlexWrap>("nowrap");
  const [justifyContent, setJustifyContent] =
    useState<JustifyContent>("flex-start");
  const [alignItems, setAlignItems] = useState<AlignItems>("stretch");
  const [alignContent, setAlignContent] = useState<AlignContent>("stretch");
  const [gap, setGap] = useState(8);
  const [itemCount, setItemCount] = useState(4);

  const flexCss = useMemo(() => {
    const lines = [
      "display: flex;",
      `flex-direction: ${direction};`,
      `flex-wrap: ${wrap};`,
      `justify-content: ${justifyContent};`,
      `align-items: ${alignItems};`,
    ];

    if (wrap !== "nowrap") {
      lines.push(`align-content: ${alignContent};`);
    }

    if (gap > 0) {
      lines.push(`gap: ${gap}px;`);
    }

    return lines.join("\n");
  }, [direction, wrap, justifyContent, alignItems, alignContent, gap]);

  // Notify parent of changes
  useMemo(() => {
    onChange?.(flexCss);
  }, [flexCss, onChange]);

  const applyPreset = (preset: (typeof PRESETS)[0]): void => {
    setDirection(preset.direction);
    setJustifyContent(preset.justify);
    setAlignItems(preset.align);
  };

  return (
    <div className={cn("w-full max-w-2xl space-y-6", className)}>
      {/* Preview */}
      <div className="bg-muted min-h-[200px] rounded-lg p-4">
        <div
          className="bg-background border-muted-foreground/30 h-full min-h-[168px] w-full rounded border-2 border-dashed p-4"
          style={{
            display: "flex",
            flexDirection: direction,
            flexWrap: wrap,
            justifyContent,
            alignItems,
            alignContent,
            gap: `${gap}px`,
          }}
        >
          {Array.from({ length: itemCount }).map((_, i) => (
            <div
              key={i}
              className="bg-primary text-primary-foreground rounded px-4 py-2 font-mono text-sm"
              style={{
                minWidth: direction.includes("column") ? "auto" : "60px",
                minHeight: direction.includes("column") ? "40px" : "auto",
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Item count control */}
      <div className="flex items-center gap-4">
        <Label className="text-sm">Items</Label>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setItemCount(Math.max(1, itemCount - 1))}
            disabled={itemCount <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-8 text-center">{itemCount}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setItemCount(Math.min(12, itemCount + 1))}
            disabled={itemCount >= 12}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">flex-direction</Label>
          <Select
            value={direction}
            onValueChange={(v) => setDirection(v as FlexDirection)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="row">row</SelectItem>
              <SelectItem value="row-reverse">row-reverse</SelectItem>
              <SelectItem value="column">column</SelectItem>
              <SelectItem value="column-reverse">column-reverse</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">flex-wrap</Label>
          <Select value={wrap} onValueChange={(v) => setWrap(v as FlexWrap)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nowrap">nowrap</SelectItem>
              <SelectItem value="wrap">wrap</SelectItem>
              <SelectItem value="wrap-reverse">wrap-reverse</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">justify-content</Label>
          <Select
            value={justifyContent}
            onValueChange={(v) => setJustifyContent(v as JustifyContent)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="flex-start">flex-start</SelectItem>
              <SelectItem value="flex-end">flex-end</SelectItem>
              <SelectItem value="center">center</SelectItem>
              <SelectItem value="space-between">space-between</SelectItem>
              <SelectItem value="space-around">space-around</SelectItem>
              <SelectItem value="space-evenly">space-evenly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">align-items</Label>
          <Select
            value={alignItems}
            onValueChange={(v) => setAlignItems(v as AlignItems)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="flex-start">flex-start</SelectItem>
              <SelectItem value="flex-end">flex-end</SelectItem>
              <SelectItem value="center">center</SelectItem>
              <SelectItem value="stretch">stretch</SelectItem>
              <SelectItem value="baseline">baseline</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {wrap !== "nowrap" && (
          <div className="space-y-2">
            <Label className="text-sm">align-content</Label>
            <Select
              value={alignContent}
              onValueChange={(v) => setAlignContent(v as AlignContent)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flex-start">flex-start</SelectItem>
                <SelectItem value="flex-end">flex-end</SelectItem>
                <SelectItem value="center">center</SelectItem>
                <SelectItem value="space-between">space-between</SelectItem>
                <SelectItem value="space-around">space-around</SelectItem>
                <SelectItem value="stretch">stretch</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-sm">gap</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[gap]}
              onValueChange={([v]) => setGap(v!)}
              min={0}
              max={40}
              step={1}
            />
            <span className="w-12 text-right text-sm">{gap}px</span>
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
        <div className="flex gap-2">
          <Input
            value={flexCss.replace(/\n/g, " ")}
            readOnly
            className="font-mono text-xs"
          />
          <CopyButton value={flexCss} size="sm" />
        </div>
      </div>
    </div>
  );
}
