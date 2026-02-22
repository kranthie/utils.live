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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { LoadingSpinner } from "@/components/display/loading-spinner";
import { cn } from "@/lib/utils";

interface QrCodeProps {
  /**
   * Data to encode in the QR code
   */
  value: string;
  /**
   * Size of the QR code in pixels
   * @default 200
   */
  size?: number;
  /**
   * Error correction level
   * @default "M"
   */
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  /**
   * Foreground color
   * @default "#000000"
   */
  fgColor?: string;
  /**
   * Background color
   * @default "#ffffff"
   */
  bgColor?: string;
  /**
   * Whether to show customization options
   * @default true
   */
  showOptions?: boolean;
  /**
   * Callback when QR code is generated
   */
  onGenerate?: (dataUrl: string) => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function QrCode({
  value,
  size: initialSize = 200,
  errorCorrectionLevel: initialLevel = "M",
  fgColor: initialFgColor = "#000000",
  bgColor: initialBgColor = "#ffffff",
  showOptions = true,
  onGenerate,
  className,
}: QrCodeProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Use ref pattern for onGenerate to avoid infinite re-render loops
  // when parent passes an unstable function reference
  const onGenerateRef = useRef(onGenerate);
  onGenerateRef.current = onGenerate;

  const [size, setSize] = useState(initialSize);
  const [errorLevel, setErrorLevel] = useState<"L" | "M" | "Q" | "H">(
    initialLevel
  );
  const [fgColor, setFgColor] = useState(initialFgColor);
  const [bgColor, setBgColor] = useState(initialBgColor);
  const [isLoading, setIsLoading] = useState(true);
  const [optionsOpen, setOptionsOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const generateQr = async (): Promise<void> => {
      if (!canvasRef.current || !value) return;

      try {
        setIsLoading(true);

        // Dynamically import qrcode library
        const QRCode = (await import("qrcode")).default;

        if (!mounted) return;

        await QRCode.toCanvas(canvasRef.current, value, {
          width: size,
          errorCorrectionLevel: errorLevel,
          color: {
            dark: fgColor,
            light: bgColor,
          },
          margin: 2,
        });

        // Get data URL for callback (use ref to avoid dependency on unstable function)
        const dataUrl = canvasRef.current.toDataURL("image/png");
        onGenerateRef.current?.(dataUrl);

        setIsLoading(false);
      } catch (error) {
        console.error("Failed to generate QR code:", error);
        setIsLoading(false);
      }
    };

    void generateQr();

    return () => {
      mounted = false;
    };
  }, [value, size, errorLevel, fgColor, bgColor]);

  const handleDownload = (format: "png" | "svg"): void => {
    if (!canvasRef.current) return;

    const link = document.createElement("a");
    link.download = `qrcode.${format}`;

    if (format === "png") {
      link.href = canvasRef.current.toDataURL("image/png");
    } else {
      // For SVG, we need to regenerate
      void import("qrcode").then((qrcodeModule) => {
        const toSvgString = qrcodeModule.toString;
        void toSvgString(value, {
          type: "svg",
          errorCorrectionLevel: errorLevel,
          color: {
            dark: fgColor,
            light: bgColor,
          },
          margin: 2,
        }).then((svg) => {
          const blob = new Blob([svg], { type: "image/svg+xml" });
          link.href = URL.createObjectURL(blob);
          link.click();
          URL.revokeObjectURL(link.href);
        });
      });
      return;
    }

    link.click();
  };

  return (
    <div className={cn("w-full max-w-sm space-y-4", className)}>
      {/* QR Code display */}
      <div className="flex justify-center rounded-lg border bg-white p-4">
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
              <LoadingSpinner size="sm" />
            </div>
          )}
          <canvas ref={canvasRef} className={cn(!value && "opacity-30")} />
          {!value && (
            <div className="text-muted-foreground absolute inset-0 flex items-center justify-center text-sm">
              Enter data to generate QR code
            </div>
          )}
        </div>
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
            {/* Size */}
            <div className="space-y-2">
              <Label className="text-sm">Size</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[size]}
                  onValueChange={([v]) => setSize(v!)}
                  min={100}
                  max={400}
                  step={10}
                />
                <span className="w-16 text-right text-sm">{size}px</span>
              </div>
            </div>

            {/* Error correction level */}
            <div className="space-y-2">
              <Label className="text-sm">Error Correction</Label>
              <Select
                value={errorLevel}
                onValueChange={(v) => setErrorLevel(v as typeof errorLevel)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">Low (~7%)</SelectItem>
                  <SelectItem value="M">Medium (~15%)</SelectItem>
                  <SelectItem value="Q">Quartile (~25%)</SelectItem>
                  <SelectItem value="H">High (~30%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Foreground</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded"
                  />
                  <Input
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Background</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded"
                  />
                  <Input
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Download buttons */}
      {value && (
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
