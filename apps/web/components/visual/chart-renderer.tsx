"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/display/loading-spinner";
import { cn } from "@/lib/utils";

// Track whether Chart.js registerables have been registered (idempotent but avoids repeated iteration)
let chartRegistered = false;

type ChartType = "line" | "bar" | "pie" | "doughnut" | "radar" | "polarArea";

interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

interface ChartRendererProps {
  /**
   * Chart data
   */
  data: ChartData;
  /**
   * Chart type
   * @default "bar"
   */
  type?: ChartType;
  /**
   * Chart title
   */
  title?: string;
  /**
   * Whether to show legend
   * @default true
   */
  showLegend?: boolean;
  /**
   * Whether to allow type switching
   * @default true
   */
  allowTypeChange?: boolean;
  /**
   * Chart height
   * @default 300
   */
  height?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const DEFAULT_COLORS = [
  "rgba(59, 130, 246, 0.8)",
  "rgba(139, 92, 246, 0.8)",
  "rgba(236, 72, 153, 0.8)",
  "rgba(34, 197, 94, 0.8)",
  "rgba(245, 158, 11, 0.8)",
  "rgba(239, 68, 68, 0.8)",
  "rgba(6, 182, 212, 0.8)",
  "rgba(168, 85, 247, 0.8)",
];

const DEFAULT_BORDER_COLORS = [
  "rgb(59, 130, 246)",
  "rgb(139, 92, 246)",
  "rgb(236, 72, 153)",
  "rgb(34, 197, 94)",
  "rgb(245, 158, 11)",
  "rgb(239, 68, 68)",
  "rgb(6, 182, 212)",
  "rgb(168, 85, 247)",
];

export function ChartRenderer({
  data,
  type: initialType = "bar",
  title,
  showLegend = true,
  allowTypeChange = true,
  height = 300,
  className,
}: ChartRendererProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<unknown>(null);
  const [chartType, setChartType] = useState(initialType);
  const [isLoading, setIsLoading] = useState(true);

  // Process data with default colors
  const processedData = useMemo(() => {
    const isPieChart =
      chartType === "pie" ||
      chartType === "doughnut" ||
      chartType === "polarArea";

    return {
      ...data,
      datasets: data.datasets.map((dataset, i) => ({
        ...dataset,
        backgroundColor:
          dataset.backgroundColor ||
          (isPieChart
            ? data.labels.map(
                (_, j) => DEFAULT_COLORS[j % DEFAULT_COLORS.length]
              )
            : DEFAULT_COLORS[i % DEFAULT_COLORS.length]),
        borderColor:
          dataset.borderColor ||
          (isPieChart
            ? data.labels.map(
                (_, j) =>
                  DEFAULT_BORDER_COLORS[j % DEFAULT_BORDER_COLORS.length]
              )
            : DEFAULT_BORDER_COLORS[i % DEFAULT_BORDER_COLORS.length]),
        borderWidth: dataset.borderWidth ?? 1,
      })),
    };
  }, [data, chartType]);

  useEffect(() => {
    let mounted = true;

    const initChart = async (): Promise<void> => {
      if (!canvasRef.current) return;

      try {
        setIsLoading(true);

        // Dynamically import Chart.js — register only once per module lifetime
        const { Chart, registerables } = await import("chart.js");
        if (!chartRegistered) {
          Chart.register(...registerables);
          chartRegistered = true;
        }

        if (!mounted) return;

        // Destroy existing chart
        if (chartRef.current) {
          (chartRef.current as { destroy: () => void }).destroy();
        }

        // Create new chart
        chartRef.current = new Chart(canvasRef.current, {
          type: chartType,
          data: processedData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: showLegend,
                position: "top",
              },
              title: {
                display: !!title,
                text: title || "",
              },
            },
            scales:
              chartType === "pie" ||
              chartType === "doughnut" ||
              chartType === "polarArea" ||
              chartType === "radar"
                ? undefined
                : {
                    y: {
                      beginAtZero: true,
                    },
                  },
          },
        });

        setIsLoading(false);
      } catch (error) {
        console.error("Failed to initialize chart:", error);
        setIsLoading(false);
      }
    };

    void initChart();

    return () => {
      mounted = false;
      if (chartRef.current) {
        (chartRef.current as { destroy: () => void }).destroy();
      }
    };
  }, [chartType, processedData, showLegend, title]);

  const handleDownload = (): void => {
    if (!canvasRef.current) return;

    const link = document.createElement("a");
    link.download = "chart.png";
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Controls */}
      <div className="flex items-center justify-between">
        {allowTypeChange && (
          <div className="flex items-center gap-2">
            <Label className="text-sm">Chart Type</Label>
            <Select
              value={chartType}
              onValueChange={(v) => setChartType(v as ChartType)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="bar">Bar</SelectItem>
                <SelectItem value="pie">Pie</SelectItem>
                <SelectItem value="doughnut">Doughnut</SelectItem>
                <SelectItem value="radar">Radar</SelectItem>
                <SelectItem value="polarArea">Polar Area</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Export PNG
        </Button>
      </div>

      {/* Chart */}
      <div
        className="bg-background relative rounded-lg border p-4"
        style={{ height }}
      >
        {isLoading && (
          <div className="bg-background/80 absolute inset-0 z-10 flex items-center justify-center">
            <LoadingSpinner label="Loading chart..." />
          </div>
        )}
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={
            title
              ? `${chartType} chart: ${title}`
              : `${chartType} chart visualization`
          }
        />
      </div>
    </div>
  );
}
