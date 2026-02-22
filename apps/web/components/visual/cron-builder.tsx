"use client";

import { useState, useMemo } from "react";
import { Clock, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/shared/copy-button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CronBuilderProps {
  /**
   * Initial cron expression
   */
  value?: string;
  /**
   * Callback when cron expression changes
   */
  onChange?: (cron: string) => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const PRESETS = [
  { name: "Every minute", cron: "* * * * *" },
  { name: "Every hour", cron: "0 * * * *" },
  { name: "Every day at midnight", cron: "0 0 * * *" },
  { name: "Every day at noon", cron: "0 12 * * *" },
  { name: "Every Sunday at midnight", cron: "0 0 * * 0" },
  { name: "Every Monday at 9am", cron: "0 9 * * 1" },
  { name: "First day of month", cron: "0 0 1 * *" },
  { name: "Every weekday at 9am", cron: "0 9 * * 1-5" },
];

const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString());
const HOURS = Array.from({ length: 24 }, (_, i) => i.toString());
const DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];
const WEEKDAYS = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

function parseCron(cron: string): {
  minute: string;
  hour: string;
  day: string;
  month: string;
  weekday: string;
} {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) {
    return { minute: "*", hour: "*", day: "*", month: "*", weekday: "*" };
  }
  return {
    minute: parts[0]!,
    hour: parts[1]!,
    day: parts[2]!,
    month: parts[3]!,
    weekday: parts[4]!,
  };
}

function describeCron(cron: string): string {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return "Invalid cron expression";

  const [minute, hour, day, month, weekday] = parts as [
    string,
    string,
    string,
    string,
    string,
  ];

  const descriptions: string[] = [];

  // Handle simple cases
  if (cron === "* * * * *") return "Every minute";
  if (cron === "0 * * * *") return "Every hour";
  if (cron === "0 0 * * *") return "Every day at midnight";

  // Minute
  if (minute === "*") {
    descriptions.push("Every minute");
  } else if (minute.includes("/")) {
    const interval = minute.split("/")[1]!;
    descriptions.push(`Every ${interval} minutes`);
  } else {
    descriptions.push(`At minute ${minute}`);
  }

  // Hour
  if (hour !== "*") {
    if (hour.includes("/")) {
      const interval = hour.split("/")[1]!;
      descriptions.push(`every ${interval} hours`);
    } else {
      const hourNum = parseInt(hour, 10);
      const ampm = hourNum >= 12 ? "PM" : "AM";
      const displayHour =
        hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
      descriptions.push(`at ${displayHour}${ampm}`);
    }
  }

  // Day of month
  if (day !== "*") {
    if (day.includes("/")) {
      const interval = day.split("/")[1]!;
      descriptions.push(`every ${interval} days`);
    } else {
      descriptions.push(`on day ${day}`);
    }
  }

  // Month
  if (month !== "*") {
    const monthName = MONTHS.find((m) => m.value === month)?.label || month;
    descriptions.push(`in ${monthName}`);
  }

  // Day of week
  if (weekday !== "*") {
    if (weekday.includes("-")) {
      const [start, end] = weekday.split("-");
      const startDay = WEEKDAYS.find((w) => w.value === start)?.label || start;
      const endDay = WEEKDAYS.find((w) => w.value === end)?.label || end;
      descriptions.push(`${startDay} through ${endDay}`);
    } else {
      const dayName =
        WEEKDAYS.find((w) => w.value === weekday)?.label || weekday;
      descriptions.push(`on ${dayName}`);
    }
  }

  return descriptions.join(" ");
}

export function CronBuilder({
  value = "* * * * *",
  onChange,
  className,
}: CronBuilderProps): React.ReactElement {
  const [mode, setMode] = useState<"simple" | "advanced">("simple");
  const [cronParts, setCronParts] = useState(parseCron(value));
  const [rawCron, setRawCron] = useState(value);

  const cronExpression = useMemo(() => {
    if (mode === "advanced") {
      return rawCron;
    }
    return `${cronParts.minute} ${cronParts.hour} ${cronParts.day} ${cronParts.month} ${cronParts.weekday}`;
  }, [mode, cronParts, rawCron]);

  const description = useMemo(
    () => describeCron(cronExpression),
    [cronExpression]
  );

  const updatePart = (part: keyof typeof cronParts, value: string): void => {
    const newParts = { ...cronParts, [part]: value };
    setCronParts(newParts);
    const newCron = `${newParts.minute} ${newParts.hour} ${newParts.day} ${newParts.month} ${newParts.weekday}`;
    setRawCron(newCron);
    onChange?.(newCron);
  };

  const applyPreset = (cron: string): void => {
    setRawCron(cron);
    setCronParts(parseCron(cron));
    onChange?.(cron);
  };

  return (
    <div className={cn("w-full max-w-lg space-y-4", className)}>
      <TooltipProvider>
        {/* Mode tabs */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simple">Simple</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="simple" className="mt-4 space-y-4">
            {/* Simple mode controls */}
            <div className="grid grid-cols-2 gap-4">
              {/* Minute */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  Minute
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="text-muted-foreground h-3 w-3" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>0-59, *, */n for intervals</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Select
                  value={cronParts.minute}
                  onValueChange={(v) => updatePart("minute", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="*">Every minute (*)</SelectItem>
                    <SelectItem value="*/5">Every 5 minutes</SelectItem>
                    <SelectItem value="*/10">Every 10 minutes</SelectItem>
                    <SelectItem value="*/15">Every 15 minutes</SelectItem>
                    <SelectItem value="*/30">Every 30 minutes</SelectItem>
                    <SelectItem value="0">At minute 0</SelectItem>
                    {MINUTES.slice(1).map((m) => (
                      <SelectItem key={m} value={m}>
                        At minute {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Hour */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  Hour
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="text-muted-foreground h-3 w-3" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>0-23, *, */n for intervals</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Select
                  value={cronParts.hour}
                  onValueChange={(v) => updatePart("hour", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="*">Every hour (*)</SelectItem>
                    <SelectItem value="*/2">Every 2 hours</SelectItem>
                    <SelectItem value="*/4">Every 4 hours</SelectItem>
                    <SelectItem value="*/6">Every 6 hours</SelectItem>
                    <SelectItem value="*/12">Every 12 hours</SelectItem>
                    {HOURS.map((h) => (
                      <SelectItem key={h} value={h}>
                        At {h}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Day of month */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  Day of Month
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="text-muted-foreground h-3 w-3" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>1-31, *, */n for intervals</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Select
                  value={cronParts.day}
                  onValueChange={(v) => updatePart("day", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="*">Every day (*)</SelectItem>
                    {DAYS.map((d) => (
                      <SelectItem key={d} value={d}>
                        Day {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Month */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  Month
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="text-muted-foreground h-3 w-3" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>1-12, *</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Select
                  value={cronParts.month}
                  onValueChange={(v) => updatePart("month", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="*">Every month (*)</SelectItem>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Day of week */}
              <div className="col-span-2 space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  Day of Week
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="text-muted-foreground h-3 w-3" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>0-6 (Sun-Sat), *, 1-5 for ranges</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Select
                  value={cronParts.weekday}
                  onValueChange={(v) => updatePart("weekday", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="*">Every day (*)</SelectItem>
                    <SelectItem value="1-5">Weekdays (Mon-Fri)</SelectItem>
                    <SelectItem value="0,6">Weekends (Sat-Sun)</SelectItem>
                    {WEEKDAYS.map((w) => (
                      <SelectItem key={w.value} value={w.value}>
                        {w.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="mt-4">
            <div className="space-y-2">
              <Label className="text-sm">Cron Expression</Label>
              <Input
                value={rawCron}
                onChange={(e) => {
                  setRawCron(e.target.value);
                  setCronParts(parseCron(e.target.value));
                  onChange?.(e.target.value);
                }}
                placeholder="* * * * *"
                className="font-mono"
              />
              <p className="text-muted-foreground text-xs">
                Format: minute hour day-of-month month day-of-week
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Output */}
        <div className="bg-muted/50 space-y-2 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="text-muted-foreground h-4 w-4" />
              <span className="font-mono text-lg">{cronExpression}</span>
            </div>
            <CopyButton value={cronExpression} size="sm" />
          </div>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>

        {/* Presets */}
        <div className="space-y-2">
          <Label className="text-sm">Common Schedules</Label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <Badge
                key={preset.cron}
                variant="outline"
                className="hover:bg-accent cursor-pointer"
                onClick={() => applyPreset(preset.cron)}
              >
                {preset.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Reference */}
        <div className="text-muted-foreground bg-muted/30 space-y-1 rounded-md p-3 text-xs">
          <p className="font-medium">Cron Syntax Reference:</p>
          <div className="grid grid-cols-5 gap-2 font-mono">
            <span>MIN</span>
            <span>HOUR</span>
            <span>DOM</span>
            <span>MON</span>
            <span>DOW</span>
          </div>
          <p>* = any, */n = every n, n-m = range, n,m = list</p>
        </div>
      </TooltipProvider>
    </div>
  );
}
