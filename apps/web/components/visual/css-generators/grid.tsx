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

type JustifyItems = "start" | "end" | "center" | "stretch";
type AlignItems = "start" | "end" | "center" | "stretch";
type JustifyContent =
  | "start"
  | "end"
  | "center"
  | "stretch"
  | "space-around"
  | "space-between"
  | "space-evenly";
type AlignContent =
  | "start"
  | "end"
  | "center"
  | "stretch"
  | "space-around"
  | "space-between"
  | "space-evenly";

interface GridGeneratorProps {
  /**
   * Callback when grid CSS changes
   */
  onChange?: (css: string) => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const PRESETS = [
  { name: "2 Column", columns: 2, rows: 1, columnTemplate: "1fr 1fr" },
  { name: "3 Column", columns: 3, rows: 1, columnTemplate: "1fr 1fr 1fr" },
  { name: "4 Column", columns: 4, rows: 1, columnTemplate: "1fr 1fr 1fr 1fr" },
  { name: "Sidebar", columns: 2, rows: 1, columnTemplate: "250px 1fr" },
  {
    name: "Holy Grail",
    columns: 3,
    rows: 3,
    columnTemplate: "200px 1fr 200px",
  },
  {
    name: "12 Column",
    columns: 12,
    rows: 1,
    columnTemplate: "repeat(12, 1fr)",
  },
];

export function GridGenerator({
  onChange,
  className,
}: GridGeneratorProps): React.ReactElement {
  const [columns, setColumns] = useState(3);
  const [_rows, setRows] = useState(2);
  const [columnGap, setColumnGap] = useState(16);
  const [rowGap, setRowGap] = useState(16);
  const [columnTemplate, setColumnTemplate] = useState("repeat(3, 1fr)");
  const [rowTemplate, setRowTemplate] = useState("auto");
  const [justifyItems, setJustifyItems] = useState<JustifyItems>("stretch");
  const [alignItems, setAlignItems] = useState<AlignItems>("stretch");
  const [justifyContent, setJustifyContent] = useState<JustifyContent>("start");
  const [alignContent, setAlignContent] = useState<AlignContent>("start");
  const [itemCount, setItemCount] = useState(6);

  const gridCss = useMemo(() => {
    const lines = [
      "display: grid;",
      `grid-template-columns: ${columnTemplate};`,
    ];

    if (rowTemplate !== "auto") {
      lines.push(`grid-template-rows: ${rowTemplate};`);
    }

    if (columnGap === rowGap) {
      lines.push(`gap: ${columnGap}px;`);
    } else {
      lines.push(`column-gap: ${columnGap}px;`);
      lines.push(`row-gap: ${rowGap}px;`);
    }

    if (justifyItems !== "stretch") {
      lines.push(`justify-items: ${justifyItems};`);
    }

    if (alignItems !== "stretch") {
      lines.push(`align-items: ${alignItems};`);
    }

    if (justifyContent !== "start") {
      lines.push(`justify-content: ${justifyContent};`);
    }

    if (alignContent !== "start") {
      lines.push(`align-content: ${alignContent};`);
    }

    return lines.join("\n");
  }, [
    columnTemplate,
    rowTemplate,
    columnGap,
    rowGap,
    justifyItems,
    alignItems,
    justifyContent,
    alignContent,
  ]);

  // Notify parent of changes
  useMemo(() => {
    onChange?.(gridCss);
  }, [gridCss, onChange]);

  const updateColumns = (count: number): void => {
    setColumns(count);
    setColumnTemplate(`repeat(${count}, 1fr)`);
  };

  const applyPreset = (preset: (typeof PRESETS)[0]): void => {
    setColumns(preset.columns);
    setRows(preset.rows);
    setColumnTemplate(preset.columnTemplate);
  };

  return (
    <div className={cn("w-full max-w-2xl space-y-6", className)}>
      {/* Preview */}
      <div className="bg-muted min-h-[250px] rounded-lg p-4">
        <div
          className="bg-background border-muted-foreground/30 h-full min-h-[218px] w-full rounded border-2 border-dashed p-4"
          style={{
            display: "grid",
            gridTemplateColumns: columnTemplate,
            gridTemplateRows: rowTemplate,
            columnGap: `${columnGap}px`,
            rowGap: `${rowGap}px`,
            justifyItems,
            alignItems,
            justifyContent,
            alignContent,
          }}
        >
          {Array.from({ length: itemCount }).map((_, i) => (
            <div
              key={i}
              className="bg-primary text-primary-foreground flex min-h-[40px] items-center justify-center rounded px-2 font-mono text-sm"
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
            onClick={() => setItemCount(Math.min(24, itemCount + 1))}
            disabled={itemCount >= 24}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Template controls */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">Columns</Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateColumns(Math.max(1, columns - 1))}
              disabled={columns <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center">{columns}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateColumns(Math.min(12, columns + 1))}
              disabled={columns >= 12}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">grid-template-columns</Label>
          <Input
            value={columnTemplate}
            onChange={(e) => setColumnTemplate(e.target.value)}
            className="font-mono text-sm"
            placeholder="1fr 1fr 1fr"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm">grid-template-rows</Label>
          <Input
            value={rowTemplate}
            onChange={(e) => setRowTemplate(e.target.value)}
            className="font-mono text-sm"
            placeholder="auto"
          />
        </div>
      </div>

      {/* Gap controls */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">column-gap</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[columnGap]}
              onValueChange={([v]) => setColumnGap(v!)}
              min={0}
              max={40}
              step={1}
            />
            <span className="w-12 text-right text-sm">{columnGap}px</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">row-gap</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[rowGap]}
              onValueChange={([v]) => setRowGap(v!)}
              min={0}
              max={40}
              step={1}
            />
            <span className="w-12 text-right text-sm">{rowGap}px</span>
          </div>
        </div>
      </div>

      {/* Alignment controls */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">justify-items</Label>
          <Select
            value={justifyItems}
            onValueChange={(v) => setJustifyItems(v as JustifyItems)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="start">start</SelectItem>
              <SelectItem value="end">end</SelectItem>
              <SelectItem value="center">center</SelectItem>
              <SelectItem value="stretch">stretch</SelectItem>
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
              <SelectItem value="start">start</SelectItem>
              <SelectItem value="end">end</SelectItem>
              <SelectItem value="center">center</SelectItem>
              <SelectItem value="stretch">stretch</SelectItem>
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
              <SelectItem value="start">start</SelectItem>
              <SelectItem value="end">end</SelectItem>
              <SelectItem value="center">center</SelectItem>
              <SelectItem value="stretch">stretch</SelectItem>
              <SelectItem value="space-around">space-around</SelectItem>
              <SelectItem value="space-between">space-between</SelectItem>
              <SelectItem value="space-evenly">space-evenly</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
              <SelectItem value="start">start</SelectItem>
              <SelectItem value="end">end</SelectItem>
              <SelectItem value="center">center</SelectItem>
              <SelectItem value="stretch">stretch</SelectItem>
              <SelectItem value="space-around">space-around</SelectItem>
              <SelectItem value="space-between">space-between</SelectItem>
              <SelectItem value="space-evenly">space-evenly</SelectItem>
            </SelectContent>
          </Select>
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
            value={gridCss.replace(/\n/g, " ")}
            readOnly
            className="font-mono text-xs"
          />
          <CopyButton value={gridCss} size="sm" />
        </div>
      </div>
    </div>
  );
}
