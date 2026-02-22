"use client";

import { useState, useMemo } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CopyButton } from "@/components/shared/copy-button";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  /**
   * Selected date
   */
  value?: Date;
  /**
   * Callback when date changes
   */
  onChange?: (date: Date) => void;
  /**
   * Output format string (date-fns format)
   * @default "yyyy-MM-dd"
   */
  outputFormat?: string;
  /**
   * Whether to show time picker
   * @default false
   */
  showTime?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const FORMATS = [
  { value: "yyyy-MM-dd", label: "ISO (2024-01-15)" },
  { value: "MM/dd/yyyy", label: "US (01/15/2024)" },
  { value: "dd/MM/yyyy", label: "EU (15/01/2024)" },
  { value: "MMMM d, yyyy", label: "Long (January 15, 2024)" },
  { value: "EEE, MMM d, yyyy", label: "Short (Mon, Jan 15, 2024)" },
  { value: "yyyy-MM-dd'T'HH:mm:ss", label: "ISO DateTime" },
  { value: "T", label: "Unix Timestamp" },
];

export function DatePicker({
  value,
  onChange,
  outputFormat = "yyyy-MM-dd",
  showTime = false,
  className,
}: DatePickerProps): React.ReactElement {
  const [selectedDate, setSelectedDate] = useState<Date>(value || new Date());
  const [viewDate, setViewDate] = useState<Date>(value || new Date());
  const [selectedFormat, setSelectedFormat] = useState(outputFormat);
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState(selectedDate.getHours());
  const [minutes, setMinutes] = useState(selectedDate.getMinutes());

  // Calendar days
  const calendarDays = useMemo(() => {
    const start = startOfMonth(viewDate);
    const end = endOfMonth(viewDate);
    const days = eachDayOfInterval({ start, end });

    // Add padding days for the start of the month
    const startDay = start.getDay();
    const paddingBefore = Array.from({ length: startDay }, (_, i) => {
      const date = new Date(start);
      date.setDate(date.getDate() - (startDay - i));
      return date;
    });

    // Add padding days for the end of the month
    const endDay = end.getDay();
    const paddingAfter = Array.from({ length: 6 - endDay }, (_, i) => {
      const date = new Date(end);
      date.setDate(date.getDate() + i + 1);
      return date;
    });

    return [...paddingBefore, ...days, ...paddingAfter];
  }, [viewDate]);

  // Format output
  const formattedOutput = useMemo(() => {
    const dateWithTime = new Date(selectedDate);
    dateWithTime.setHours(hours, minutes, 0, 0);

    if (selectedFormat === "T") {
      return Math.floor(dateWithTime.getTime() / 1000).toString();
    }
    return format(dateWithTime, selectedFormat);
  }, [selectedDate, selectedFormat, hours, minutes]);

  const handleDateSelect = (date: Date): void => {
    setSelectedDate(date);
    const dateWithTime = new Date(date);
    dateWithTime.setHours(hours, minutes, 0, 0);
    onChange?.(dateWithTime);
    if (!showTime) {
      setIsOpen(false);
    }
  };

  const handleTimeChange = (newHours: number, newMinutes: number): void => {
    setHours(newHours);
    setMinutes(newMinutes);
    const dateWithTime = new Date(selectedDate);
    dateWithTime.setHours(newHours, newMinutes, 0, 0);
    onChange?.(dateWithTime);
  };

  const goToPreviousMonth = (): void => setViewDate(subMonths(viewDate, 1));
  const goToNextMonth = (): void => setViewDate(addMonths(viewDate, 1));
  const goToToday = (): void => {
    const today = new Date();
    setViewDate(today);
    handleDateSelect(today);
  };

  return (
    <div className={cn("w-full max-w-sm space-y-4", className)}>
      {/* Date picker trigger */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {selectedDate ? (
              format(selectedDate, "PPP")
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3">
            {/* Header */}
            <div className="mb-2 flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium">
                {format(viewDate, "MMMM yyyy")}
              </span>
              <Button variant="ghost" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Weekday headers */}
            <div className="mb-1 grid grid-cols-7 gap-1">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="text-muted-foreground p-2 text-center text-xs font-medium"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, i) => {
                const isSelected = isSameDay(date, selectedDate);
                const isCurrentMonth = isSameMonth(date, viewDate);
                const isTodayDate = isToday(date);

                return (
                  <button
                    key={i}
                    onClick={() => handleDateSelect(date)}
                    className={cn(
                      "h-8 w-8 rounded-md text-sm transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-hidden",
                      !isCurrentMonth && "text-muted-foreground/50",
                      isSelected &&
                        "bg-primary text-primary-foreground hover:bg-primary/90",
                      isTodayDate && !isSelected && "border-primary border"
                    )}
                  >
                    {format(date, "d")}
                  </button>
                );
              })}
            </div>

            {/* Time picker */}
            {showTime && (
              <div className="mt-3 flex items-center gap-2 border-t pt-3">
                <Label className="text-sm">Time:</Label>
                <Select
                  value={hours.toString()}
                  onValueChange={(v) =>
                    handleTimeChange(parseInt(v, 10), minutes)
                  }
                >
                  <SelectTrigger className="w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i.toString().padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>:</span>
                <Select
                  value={minutes.toString()}
                  onValueChange={(v) =>
                    handleTimeChange(hours, parseInt(v, 10))
                  }
                >
                  <SelectTrigger className="w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 60 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i.toString().padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Today button */}
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full"
              onClick={goToToday}
            >
              Today
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Format selector */}
      <div className="space-y-2">
        <Label className="text-sm">Output Format</Label>
        <Select value={selectedFormat} onValueChange={setSelectedFormat}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FORMATS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Output */}
      <div className="space-y-2">
        <Label className="text-sm">Formatted Output</Label>
        <div className="flex items-center gap-2">
          <Input
            value={formattedOutput}
            readOnly
            className="font-mono text-sm"
          />
          <CopyButton value={formattedOutput} size="sm" />
        </div>
      </div>

      {/* Quick info */}
      <div className="text-muted-foreground bg-muted/30 space-y-1 rounded-md p-3 text-xs">
        <p>
          <strong>Day of year:</strong> {format(selectedDate, "D")}
        </p>
        <p>
          <strong>Week of year:</strong> {format(selectedDate, "w")}
        </p>
        <p>
          <strong>Unix timestamp:</strong>{" "}
          {Math.floor(selectedDate.getTime() / 1000)}
        </p>
      </div>
    </div>
  );
}
