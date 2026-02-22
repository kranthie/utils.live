"use client";

import { useState, useCallback, useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
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

interface GradientStop {
  id: string;
  color: string;
  position: number;
}

type GradientType = "linear" | "radial" | "conic";

interface GradientEditorProps {
  /**
   * Initial gradient value (CSS gradient string)
   */
  value?: string;
  /**
   * Callback when gradient changes
   */
  onChange?: (gradient: string) => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

const DEFAULT_STOPS: GradientStop[] = [
  { id: generateId(), color: "#3B82F6", position: 0 },
  { id: generateId(), color: "#8B5CF6", position: 100 },
];

const PRESET_GRADIENTS = [
  {
    name: "Sunset",
    stops: [
      { color: "#F97316", position: 0 },
      { color: "#EC4899", position: 100 },
    ],
  },
  {
    name: "Ocean",
    stops: [
      { color: "#0EA5E9", position: 0 },
      { color: "#06B6D4", position: 100 },
    ],
  },
  {
    name: "Forest",
    stops: [
      { color: "#22C55E", position: 0 },
      { color: "#16A34A", position: 100 },
    ],
  },
  {
    name: "Purple",
    stops: [
      { color: "#A855F7", position: 0 },
      { color: "#6366F1", position: 100 },
    ],
  },
  {
    name: "Fire",
    stops: [
      { color: "#EF4444", position: 0 },
      { color: "#F59E0B", position: 50 },
      { color: "#FBBF24", position: 100 },
    ],
  },
  {
    name: "Rainbow",
    stops: [
      { color: "#EF4444", position: 0 },
      { color: "#F59E0B", position: 20 },
      { color: "#22C55E", position: 40 },
      { color: "#0EA5E9", position: 60 },
      { color: "#8B5CF6", position: 80 },
      { color: "#EC4899", position: 100 },
    ],
  },
];

export function GradientEditor({
  onChange,
  className,
}: GradientEditorProps): React.ReactElement {
  const [stops, setStops] = useState<GradientStop[]>(DEFAULT_STOPS);
  const [gradientType, setGradientType] = useState<GradientType>("linear");
  const [angle, setAngle] = useState(90);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(
    stops[0]?.id || null
  );

  // Generate CSS gradient string
  const gradientCss = useMemo(() => {
    const sortedStops = [...stops].sort((a, b) => a.position - b.position);
    const stopsString = sortedStops
      .map((s) => `${s.color} ${s.position}%`)
      .join(", ");

    switch (gradientType) {
      case "linear":
        return `linear-gradient(${angle}deg, ${stopsString})`;
      case "radial":
        return `radial-gradient(circle, ${stopsString})`;
      case "conic":
        return `conic-gradient(from ${angle}deg, ${stopsString})`;
      default:
        return `linear-gradient(${angle}deg, ${stopsString})`;
    }
  }, [stops, gradientType, angle]);

  // Notify parent of changes
  const updateGradient = useCallback(
    (newStops: GradientStop[], newType?: GradientType, newAngle?: number) => {
      const sortedStops = [...newStops].sort((a, b) => a.position - b.position);
      const stopsString = sortedStops
        .map((s) => `${s.color} ${s.position}%`)
        .join(", ");
      const type = newType ?? gradientType;
      const deg = newAngle ?? angle;

      let css: string;
      switch (type) {
        case "linear":
          css = `linear-gradient(${deg}deg, ${stopsString})`;
          break;
        case "radial":
          css = `radial-gradient(circle, ${stopsString})`;
          break;
        case "conic":
          css = `conic-gradient(from ${deg}deg, ${stopsString})`;
          break;
        default:
          css = `linear-gradient(${deg}deg, ${stopsString})`;
      }

      onChange?.(css);
    },
    [gradientType, angle, onChange]
  );

  const addStop = (): void => {
    // Add a stop in the middle
    const newStop: GradientStop = {
      id: generateId(),
      color: "#808080",
      position: 50,
    };
    const newStops = [...stops, newStop];
    setStops(newStops);
    setSelectedStopId(newStop.id);
    updateGradient(newStops);
  };

  const removeStop = (id: string): void => {
    if (stops.length <= 2) return; // Need at least 2 stops
    const newStops = stops.filter((s) => s.id !== id);
    setStops(newStops);
    if (selectedStopId === id) {
      setSelectedStopId(newStops[0]?.id || null);
    }
    updateGradient(newStops);
  };

  const updateStop = (id: string, updates: Partial<GradientStop>): void => {
    const newStops = stops.map((s) => (s.id === id ? { ...s, ...updates } : s));
    setStops(newStops);
    updateGradient(newStops);
  };

  const applyPreset = (preset: (typeof PRESET_GRADIENTS)[0]): void => {
    const newStops = preset.stops.map((s) => ({
      id: generateId(),
      color: s.color,
      position: s.position,
    }));
    setStops(newStops);
    setSelectedStopId(newStops[0]?.id || null);
    updateGradient(newStops);
  };

  const selectedStop = stops.find((s) => s.id === selectedStopId);

  return (
    <div className={cn("w-full max-w-md space-y-4", className)}>
      {/* Gradient preview */}
      <div
        className="h-32 rounded-lg border shadow-inner"
        style={{ background: gradientCss }}
      />

      {/* Gradient type and angle */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">Type</Label>
          <Select
            value={gradientType}
            onValueChange={(v) => {
              setGradientType(v as GradientType);
              updateGradient(stops, v as GradientType);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="linear">Linear</SelectItem>
              <SelectItem value="radial">Radial</SelectItem>
              <SelectItem value="conic">Conic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">
            {gradientType === "linear"
              ? "Angle"
              : gradientType === "conic"
                ? "Start Angle"
                : "Position"}
          </Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[angle]}
              onValueChange={([v]) => {
                setAngle(v!);
                updateGradient(stops, undefined, v);
              }}
              max={360}
              step={1}
              disabled={gradientType === "radial"}
            />
            <span className="text-muted-foreground w-12 text-right text-sm">
              {angle}°
            </span>
          </div>
        </div>
      </div>

      {/* Stop bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Color Stops</Label>
          <Button variant="ghost" size="sm" onClick={addStop}>
            <Plus className="mr-1 h-4 w-4" />
            Add Stop
          </Button>
        </div>
        <div
          className="relative h-6 cursor-pointer rounded-md border"
          style={{ background: gradientCss }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const position = Math.round(
              ((e.clientX - rect.left) / rect.width) * 100
            );
            const newStop: GradientStop = {
              id: generateId(),
              color: "#808080",
              position,
            };
            const newStops = [...stops, newStop];
            setStops(newStops);
            setSelectedStopId(newStop.id);
            updateGradient(newStops);
          }}
        >
          {stops.map((stop) => (
            <button
              key={stop.id}
              className={cn(
                "absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 transform rounded-full border-2 transition-all",
                selectedStopId === stop.id
                  ? "ring-primary scale-110 border-white ring-2"
                  : "border-white/80"
              )}
              style={{
                left: `${stop.position}%`,
                backgroundColor: stop.color,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedStopId(stop.id);
              }}
            />
          ))}
        </div>
      </div>

      {/* Selected stop editor */}
      {selectedStop && (
        <div className="bg-muted/50 space-y-3 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Edit Stop</Label>
            {stops.length > 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeStop(selectedStop.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedStop.color}
                  onChange={(e) =>
                    updateStop(selectedStop.id, { color: e.target.value })
                  }
                  className="h-8 w-8 cursor-pointer rounded"
                />
                <Input
                  value={selectedStop.color}
                  onChange={(e) =>
                    updateStop(selectedStop.id, { color: e.target.value })
                  }
                  className="h-8 font-mono text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">Position</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[selectedStop.position]}
                  onValueChange={([v]) =>
                    updateStop(selectedStop.id, { position: v })
                  }
                  max={100}
                  step={1}
                />
                <span className="w-10 text-right text-sm">
                  {selectedStop.position}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Presets */}
      <div className="space-y-2">
        <Label className="text-sm">Presets</Label>
        <div className="grid grid-cols-6 gap-2">
          {PRESET_GRADIENTS.map((preset) => (
            <button
              key={preset.name}
              className="hover:ring-primary h-8 rounded-md border shadow-xs transition-all hover:ring-2"
              style={{
                background: `linear-gradient(90deg, ${preset.stops.map((s) => `${s.color} ${s.position}%`).join(", ")})`,
              }}
              onClick={() => applyPreset(preset)}
              title={preset.name}
            />
          ))}
        </div>
      </div>

      {/* CSS Output */}
      <div className="space-y-2">
        <Label className="text-sm">CSS</Label>
        <div className="flex items-center gap-2">
          <Input value={gradientCss} readOnly className="font-mono text-xs" />
          <CopyButton value={gradientCss} size="sm" />
        </div>
      </div>
    </div>
  );
}
