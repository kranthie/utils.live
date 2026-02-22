"use client";

import { useState, useEffect, useRef } from "react";
import { Download, Settings } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { LoadingSpinner } from "@/components/display/loading-spinner";
import { ErrorDisplay } from "@/components/display/error-display";
import { cn } from "@/lib/utils";

type BarcodeFormat =
  | "CODE128"
  | "CODE39"
  | "EAN13"
  | "EAN8"
  | "UPC"
  | "ITF14"
  | "MSI"
  | "pharmacode";

interface BarcodeProps {
  /**
   * Data to encode in the barcode
   */
  value: string;
  /**
   * Barcode format
   * @default "CODE128"
   */
  format?: BarcodeFormat;
  /**
   * Width of individual bars
   * @default 2
   */
  width?: number;
  /**
   * Height of the barcode
   * @default 100
   */
  height?: number;
  /**
   * Whether to display the value below the barcode
   * @default true
   */
  displayValue?: boolean;
  /**
   * Foreground color
   * @default "#000000"
   */
  lineColor?: string;
  /**
   * Background color
   * @default "#ffffff"
   */
  background?: string;
  /**
   * Whether to show customization options
   * @default true
   */
  showOptions?: boolean;
  /**
   * Callback when barcode is generated
   */
  onGenerate?: (dataUrl: string) => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const FORMAT_INFO: Record<
  BarcodeFormat,
  { name: string; description: string; example: string }
> = {
  CODE128: {
    name: "Code 128",
    description: "Alphanumeric, variable length",
    example: "ABC-12345",
  },
  CODE39: {
    name: "Code 39",
    description: "Alphanumeric, variable length",
    example: "HELLO",
  },
  EAN13: {
    name: "EAN-13",
    description: "13 digits, retail products",
    example: "5901234123457",
  },
  EAN8: {
    name: "EAN-8",
    description: "8 digits, small products",
    example: "96385074",
  },
  UPC: {
    name: "UPC-A",
    description: "12 digits, US retail",
    example: "012345678905",
  },
  ITF14: {
    name: "ITF-14",
    description: "14 digits, shipping containers",
    example: "10012345678902",
  },
  MSI: { name: "MSI", description: "Numeric, inventory", example: "12345678" },
  pharmacode: {
    name: "Pharmacode",
    description: "Numeric, pharmaceutical",
    example: "12345",
  },
};

export function Barcode({
  value,
  format: initialFormat = "CODE128",
  width: initialWidth = 2,
  height: initialHeight = 100,
  displayValue: initialDisplayValue = true,
  lineColor: initialLineColor = "#000000",
  background: initialBackground = "#ffffff",
  showOptions = true,
  onGenerate,
  className,
}: BarcodeProps): React.ReactElement {
  const svgRef = useRef<SVGSVGElement>(null);
  const [format, setFormat] = useState<BarcodeFormat>(initialFormat);
  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(initialHeight);
  const [displayValueOption, setDisplayValueOption] =
    useState(initialDisplayValue);
  const [lineColor, setLineColor] = useState(initialLineColor);
  const [background, setBackground] = useState(initialBackground);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const generateBarcode = async (): Promise<void> => {
      if (!svgRef.current || !value) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Dynamically import JsBarcode
        const JsBarcode = (await import("jsbarcode")).default;

        if (!mounted) return;

        JsBarcode(svgRef.current, value, {
          format,
          width,
          height,
          displayValue: displayValueOption,
          lineColor,
          background,
          margin: 10,
          fontSize: 14,
          font: "monospace",
        });

        // Get data URL for callback
        const svgData = new XMLSerializer().serializeToString(svgRef.current);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          onGenerate?.(canvas.toDataURL("image/png"));
        };
        img.src = "data:image/svg+xml;base64," + btoa(svgData);

        setIsLoading(false);
      } catch (err) {
        if (mounted) {
          setError((err as Error).message);
          setIsLoading(false);
        }
      }
    };

    void generateBarcode();

    return () => {
      mounted = false;
    };
  }, [
    value,
    format,
    width,
    height,
    displayValueOption,
    lineColor,
    background,
    onGenerate,
  ]);

  const handleDownload = (imageFormat: "png" | "svg"): void => {
    if (!svgRef.current) return;

    const link = document.createElement("a");
    link.download = `barcode.${imageFormat}`;

    if (imageFormat === "svg") {
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const blob = new Blob([svgData], { type: "image/svg+xml" });
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    } else {
      // Convert to PNG
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        link.href = canvas.toDataURL("image/png");
        link.click();
      };
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  };

  return (
    <div className={cn("w-full max-w-md space-y-4", className)}>
      {/* Barcode display */}
      <div className="flex justify-center overflow-auto rounded-lg border bg-white p-4">
        <div className="relative min-w-[200px]">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
              <LoadingSpinner size="sm" />
            </div>
          )}
          {error ? (
            <ErrorDisplay message={error} />
          ) : (
            <svg ref={svgRef} className={cn(!value && "opacity-30")} />
          )}
          {!value && !error && (
            <div className="text-muted-foreground absolute inset-0 flex items-center justify-center text-sm">
              Enter data to generate barcode
            </div>
          )}
        </div>
      </div>

      {/* Format selector */}
      <div className="space-y-2">
        <Label className="text-sm">Format</Label>
        <Select
          value={format}
          onValueChange={(v) => setFormat(v as BarcodeFormat)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(FORMAT_INFO).map(([key, info]) => (
              <SelectItem key={key} value={key}>
                <div className="flex flex-col">
                  <span>{info.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {info.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-xs">
          Example: {FORMAT_INFO[format].example}
        </p>
      </div>

      {/* Options */}
      {showOptions && (
        <Collapsible open={optionsOpen} onOpenChange={setOptionsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full">
              <Settings className="mr-2 h-4 w-4" />
              Customize
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            {/* Bar width */}
            <div className="space-y-2">
              <Label className="text-sm">Bar Width</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[width]}
                  onValueChange={([v]) => setWidth(v!)}
                  min={1}
                  max={5}
                  step={0.5}
                />
                <span className="w-12 text-right text-sm">{width}px</span>
              </div>
            </div>

            {/* Height */}
            <div className="space-y-2">
              <Label className="text-sm">Height</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[height]}
                  onValueChange={([v]) => setHeight(v!)}
                  min={50}
                  max={200}
                  step={10}
                />
                <span className="w-16 text-right text-sm">{height}px</span>
              </div>
            </div>

            {/* Display value */}
            <div className="flex items-center justify-between">
              <Label className="text-sm">Show Value</Label>
              <Switch
                checked={displayValueOption}
                onCheckedChange={setDisplayValueOption}
              />
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Line Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={lineColor}
                    onChange={(e) => setLineColor(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded"
                  />
                  <Input
                    value={lineColor}
                    onChange={(e) => setLineColor(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Background</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded"
                  />
                  <Input
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Download buttons */}
      {value && !error && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => handleDownload("png")}
          >
            <Download className="mr-2 h-4 w-4" />
            PNG
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => handleDownload("svg")}
          >
            <Download className="mr-2 h-4 w-4" />
            SVG
          </Button>
        </div>
      )}
    </div>
  );
}
