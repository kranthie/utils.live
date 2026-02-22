"use client";

import { useState, useMemo } from "react";
import { AlertCircle, CheckCircle, Flag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/shared/copy-button";
import { cn } from "@/lib/utils";

interface RegexTesterProps {
  /**
   * Initial regex pattern
   */
  pattern?: string;
  /**
   * Initial test string
   */
  testString?: string;
  /**
   * Callback when pattern changes
   */
  onChange?: (pattern: string, flags: string) => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

interface Match {
  match: string;
  index: number;
  groups: string[];
}

const COMMON_PATTERNS = [
  { name: "Email", pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}" },
  { name: "URL", pattern: "https?:\\/\\/[\\w\\-._~:/?#[\\]@!$&'()*+,;=%]+" },
  { name: "Phone", pattern: "\\+?[1-9]\\d{1,14}" },
  {
    name: "IP Address",
    pattern:
      "\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b",
  },
  { name: "Date (YYYY-MM-DD)", pattern: "\\d{4}-\\d{2}-\\d{2}" },
  { name: "Hex Color", pattern: "#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})" },
];

export function RegexTester({
  pattern: initialPattern = "",
  testString: initialTestString = "",
  onChange,
  className,
}: RegexTesterProps): React.ReactElement {
  const [pattern, setPattern] = useState(initialPattern);
  const [testString, setTestString] = useState(initialTestString);
  const [flags, setFlags] = useState({
    global: true,
    caseInsensitive: false,
    multiline: false,
    dotAll: false,
    unicode: false,
    sticky: false,
  });

  const flagString = useMemo(() => {
    let str = "";
    if (flags.global) str += "g";
    if (flags.caseInsensitive) str += "i";
    if (flags.multiline) str += "m";
    if (flags.dotAll) str += "s";
    if (flags.unicode) str += "u";
    if (flags.sticky) str += "y";
    return str;
  }, [flags]);

  const { regex, error, matches } = useMemo(() => {
    if (!pattern) {
      return { regex: null, error: null, matches: [] };
    }

    try {
      const re = new RegExp(pattern, flagString);
      const matchList: Match[] = [];

      if (testString) {
        if (flags.global) {
          let match;
          while ((match = re.exec(testString)) !== null) {
            matchList.push({
              match: match[0],
              index: match.index,
              groups: match.slice(1),
            });
            // Prevent infinite loop for zero-width matches
            if (match.index === re.lastIndex) {
              re.lastIndex++;
            }
          }
        } else {
          const match = re.exec(testString);
          if (match) {
            matchList.push({
              match: match[0],
              index: match.index,
              groups: match.slice(1),
            });
          }
        }
      }

      return { regex: re, error: null, matches: matchList };
    } catch (err) {
      return { regex: null, error: (err as Error).message, matches: [] };
    }
  }, [pattern, testString, flagString, flags.global]);

  // Highlight matches in test string
  const highlightedText = useMemo(() => {
    if (!testString || !regex || error || matches.length === 0) {
      return testString;
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    matches.forEach((match, i) => {
      if (match.index > lastIndex) {
        parts.push(testString.slice(lastIndex, match.index));
      }
      parts.push(
        <mark
          key={i}
          className="rounded bg-yellow-300 px-0.5 dark:bg-yellow-600"
        >
          {match.match}
        </mark>
      );
      lastIndex = match.index + match.match.length;
    });

    if (lastIndex < testString.length) {
      parts.push(testString.slice(lastIndex));
    }

    return parts;
  }, [testString, regex, error, matches]);

  const handlePatternChange = (value: string): void => {
    setPattern(value);
    onChange?.(value, flagString);
  };

  const handleFlagChange = (flag: keyof typeof flags, value: boolean): void => {
    const newFlags = { ...flags, [flag]: value };
    setFlags(newFlags);
    let str = "";
    if (newFlags.global) str += "g";
    if (newFlags.caseInsensitive) str += "i";
    if (newFlags.multiline) str += "m";
    if (newFlags.dotAll) str += "s";
    if (newFlags.unicode) str += "u";
    if (newFlags.sticky) str += "y";
    onChange?.(pattern, str);
  };

  const fullRegex = pattern ? `/${pattern}/${flagString}` : "";

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Pattern input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Regular Expression</Label>
          {fullRegex && <CopyButton value={fullRegex} size="sm" />}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-mono">/</span>
          <Input
            value={pattern}
            onChange={(e) => handlePatternChange(e.target.value)}
            placeholder="Enter regex pattern..."
            className={cn("font-mono", error && "border-destructive")}
          />
          <span className="text-muted-foreground font-mono">/</span>
          <span className="text-primary font-mono">{flagString}</span>
        </div>
        {error && (
          <div className="text-destructive flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </div>

      {/* Flags */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm">
          <Flag className="h-4 w-4" />
          Flags
        </Label>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="flag-g"
              checked={flags.global}
              onCheckedChange={(v) => handleFlagChange("global", !!v)}
            />
            <label htmlFor="flag-g" className="cursor-pointer text-sm">
              <span className="text-primary font-mono">g</span> global
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="flag-i"
              checked={flags.caseInsensitive}
              onCheckedChange={(v) => handleFlagChange("caseInsensitive", !!v)}
            />
            <label htmlFor="flag-i" className="cursor-pointer text-sm">
              <span className="text-primary font-mono">i</span> case insensitive
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="flag-m"
              checked={flags.multiline}
              onCheckedChange={(v) => handleFlagChange("multiline", !!v)}
            />
            <label htmlFor="flag-m" className="cursor-pointer text-sm">
              <span className="text-primary font-mono">m</span> multiline
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="flag-s"
              checked={flags.dotAll}
              onCheckedChange={(v) => handleFlagChange("dotAll", !!v)}
            />
            <label htmlFor="flag-s" className="cursor-pointer text-sm">
              <span className="text-primary font-mono">s</span> dotAll
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="flag-u"
              checked={flags.unicode}
              onCheckedChange={(v) => handleFlagChange("unicode", !!v)}
            />
            <label htmlFor="flag-u" className="cursor-pointer text-sm">
              <span className="text-primary font-mono">u</span> unicode
            </label>
          </div>
        </div>
      </div>

      {/* Test string */}
      <div className="space-y-2">
        <Label className="text-sm">Test String</Label>
        <Textarea
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
          placeholder="Enter text to test against the regex..."
          rows={4}
          className="font-mono text-sm"
        />
      </div>

      {/* Highlighted result */}
      {testString && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm">
            {matches.length > 0 ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="text-muted-foreground h-4 w-4" />
            )}
            Result ({matches.length} match{matches.length !== 1 ? "es" : ""})
          </Label>
          <div className="bg-muted/50 rounded-md border p-3 font-mono text-sm break-all whitespace-pre-wrap">
            {highlightedText}
          </div>
        </div>
      )}

      {/* Match details */}
      {matches.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm">Match Details</Label>
          <div className="max-h-48 space-y-2 overflow-auto">
            {matches.map((match, i) => (
              <div
                key={i}
                className="bg-muted/30 rounded-md border p-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {i + 1}
                  </Badge>
                  <span className="text-primary font-mono">{`"${match.match}"`}</span>
                  <span className="text-muted-foreground">
                    at index {match.index}
                  </span>
                </div>
                {match.groups.length > 0 && (
                  <div className="text-muted-foreground mt-1 pl-6">
                    Groups:{" "}
                    {match.groups.map((g, j) => (
                      <span key={j} className="text-primary mr-2 font-mono">
                        ${j + 1}={`"${g}"`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Common patterns */}
      <div className="space-y-2">
        <Label className="text-sm">Common Patterns</Label>
        <div className="flex flex-wrap gap-2">
          {COMMON_PATTERNS.map((item) => (
            <Badge
              key={item.name}
              variant="outline"
              className="hover:bg-accent cursor-pointer"
              onClick={() => handlePatternChange(item.pattern)}
            >
              {item.name}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
