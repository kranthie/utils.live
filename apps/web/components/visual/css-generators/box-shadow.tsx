"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { CopyButton } from "@/components/shared/copy-button";
import { cn } from "@/lib/utils";

interface Shadow {
  id: string;
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  inset: boolean;
  enabled: boolean;
}

interface BoxShadowGeneratorProps {
  /**
   * Callback when shadow CSS changes
   */
  onChange?: (css: string) => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

const DEFAULT_SHADOW: Shadow = {
  id: generateId(),
  x: 4,
  y: 4,
  blur: 10,
  spread: 0,
  color: "rgba(0, 0, 0, 0.25)",
  inset: false,
  enabled: true,
};

const PRESETS = [
  {
    name: "Subtle",
    shadows: [
      {
        x: 0,
        y: 1,
        blur: 3,
        spread: 0,
        color: "rgba(0, 0, 0, 0.12)",
        inset: false,
      },
    ],
  },
  {
    name: "Medium",
    shadows: [
      {
        x: 0,
        y: 4,
        blur: 6,
        spread: -1,
        color: "rgba(0, 0, 0, 0.1)",
        inset: false,
      },
      {
        x: 0,
        y: 2,
        blur: 4,
        spread: -1,
        color: "rgba(0, 0, 0, 0.06)",
        inset: false,
      },
    ],
  },
  {
    name: "Large",
    shadows: [
      {
        x: 0,
        y: 10,
        blur: 15,
        spread: -3,
        color: "rgba(0, 0, 0, 0.1)",
        inset: false,
      },
      {
        x: 0,
        y: 4,
        blur: 6,
        spread: -2,
        color: "rgba(0, 0, 0, 0.05)",
        inset: false,
      },
    ],
  },
  {
    name: "Inset",
    shadows: [
      {
        x: 0,
        y: 2,
        blur: 4,
        spread: 0,
        color: "rgba(0, 0, 0, 0.1)",
        inset: true,
      },
    ],
  },
];

export function BoxShadowGenerator({
  onChange,
  className,
}: BoxShadowGeneratorProps): React.ReactElement {
  const [shadows, setShadows] = useState<Shadow[]>([{ ...DEFAULT_SHADOW }]);
  const [selectedId, setSelectedId] = useState<string>(shadows[0]!.id);
  const [previewBg, setPreviewBg] = useState("#f3f4f6");

  const shadowCss = useMemo(() => {
    const enabledShadows = shadows.filter((s) => s.enabled);
    if (enabledShadows.length === 0) return "none";

    return enabledShadows
      .map((s) => {
        const insetStr = s.inset ? "inset " : "";
        return `${insetStr}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${s.color}`;
      })
      .join(", ");
  }, [shadows]);

  const updateShadow = (id: string, updates: Partial<Shadow>): void => {
    const newShadows = shadows.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    );
    setShadows(newShadows);
    onChange?.(
      newShadows
        .filter((s) => s.enabled)
        .map((s) => {
          const insetStr = s.inset ? "inset " : "";
          return `${insetStr}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${s.color}`;
        })
        .join(", ") || "none"
    );
  };

  const addShadow = (): void => {
    const newShadow: Shadow = {
      ...DEFAULT_SHADOW,
      id: generateId(),
    };
    setShadows([...shadows, newShadow]);
    setSelectedId(newShadow.id);
  };

  const removeShadow = (id: string): void => {
    if (shadows.length <= 1) return;
    const newShadows = shadows.filter((s) => s.id !== id);
    setShadows(newShadows);
    if (selectedId === id) {
      setSelectedId(newShadows[0]!.id);
    }
  };

  const applyPreset = (preset: (typeof PRESETS)[0]): void => {
    const newShadows = preset.shadows.map((s) => ({
      ...s,
      id: generateId(),
      enabled: true,
    }));
    setShadows(newShadows);
    setSelectedId(newShadows[0]!.id);
  };

  const selectedShadow = shadows.find((s) => s.id === selectedId);

  return (
    <div className={cn("w-full max-w-lg space-y-6", className)}>
      {/* Preview */}
      <div
        className="flex h-48 items-center justify-center rounded-lg"
        style={{ backgroundColor: previewBg }}
      >
        <div
          className="h-32 w-32 rounded-lg bg-white"
          style={{ boxShadow: shadowCss }}
        />
      </div>

      {/* Background color */}
      <div className="flex items-center gap-4">
        <Label className="text-sm whitespace-nowrap">Preview Background</Label>
        <input
          type="color"
          value={previewBg}
          onChange={(e) => setPreviewBg(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded"
        />
      </div>

      {/* Shadows list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Shadows</Label>
          <Button variant="ghost" size="sm" onClick={addShadow}>
            <Plus className="mr-1 h-4 w-4" />
            Add Layer
          </Button>
        </div>
        <div className="space-y-1">
          {shadows.map((shadow, index) => (
            <div
              key={shadow.id}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md p-2",
                selectedId === shadow.id ? "bg-accent" : "hover:bg-muted"
              )}
              onClick={() => setSelectedId(shadow.id)}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  updateShadow(shadow.id, { enabled: !shadow.enabled });
                }}
              >
                {shadow.enabled ? (
                  <Eye className="h-3 w-3" />
                ) : (
                  <EyeOff className="text-muted-foreground h-3 w-3" />
                )}
              </Button>
              <span className="flex-1 text-sm">Shadow {index + 1}</span>
              <div
                className="h-4 w-4 rounded border"
                style={{ backgroundColor: shadow.color }}
              />
              {shadows.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeShadow(shadow.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Shadow editor */}
      {selectedShadow && (
        <div className="bg-muted/50 space-y-4 rounded-lg border p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">X Offset</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[selectedShadow.x]}
                  onValueChange={([v]) =>
                    updateShadow(selectedShadow.id, { x: v })
                  }
                  min={-50}
                  max={50}
                  step={1}
                />
                <span className="w-10 text-right text-sm">
                  {selectedShadow.x}px
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Y Offset</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[selectedShadow.y]}
                  onValueChange={([v]) =>
                    updateShadow(selectedShadow.id, { y: v })
                  }
                  min={-50}
                  max={50}
                  step={1}
                />
                <span className="w-10 text-right text-sm">
                  {selectedShadow.y}px
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Blur</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[selectedShadow.blur]}
                  onValueChange={([v]) =>
                    updateShadow(selectedShadow.id, { blur: v })
                  }
                  min={0}
                  max={100}
                  step={1}
                />
                <span className="w-10 text-right text-sm">
                  {selectedShadow.blur}px
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Spread</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[selectedShadow.spread]}
                  onValueChange={([v]) =>
                    updateShadow(selectedShadow.id, { spread: v })
                  }
                  min={-50}
                  max={50}
                  step={1}
                />
                <span className="w-10 text-right text-sm">
                  {selectedShadow.spread}px
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Label className="text-sm">Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={
                    selectedShadow.color.startsWith("rgba")
                      ? "#000000"
                      : selectedShadow.color
                  }
                  onChange={(e) =>
                    updateShadow(selectedShadow.id, { color: e.target.value })
                  }
                  className="h-8 w-8 cursor-pointer rounded"
                />
                <Input
                  value={selectedShadow.color}
                  onChange={(e) =>
                    updateShadow(selectedShadow.id, { color: e.target.value })
                  }
                  className="font-mono text-sm"
                  placeholder="rgba(0, 0, 0, 0.25)"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <Switch
                checked={selectedShadow.inset}
                onCheckedChange={(v) =>
                  updateShadow(selectedShadow.id, { inset: v })
                }
              />
              <Label className="text-sm">Inset</Label>
            </div>
          </div>
        </div>
      )}

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
            value={`box-shadow: ${shadowCss};`}
            readOnly
            className="font-mono text-xs"
          />
          <CopyButton value={`box-shadow: ${shadowCss};`} size="sm" />
        </div>
      </div>
    </div>
  );
}
