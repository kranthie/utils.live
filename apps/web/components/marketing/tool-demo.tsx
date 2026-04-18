"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { m, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { fadeIn, VIEWPORT_ONCE } from "@/lib/animation";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { QRCodeDemo, MermaidDemo } from "./demo-visuals";

interface Demo {
  toolName: string;
  input: string;
  output: string;
  inputSpeed: number;
  highlight: "json" | "plain";
  outputType: "text" | "visual";
  visualOutput?: React.ReactNode;
}

function getDemos(toolCount: number): Demo[] {
  return [
    {
      toolName: "JSON Formatter",
      input: `{"name":"utils.live","tools":${toolCount},"free":true}`,
      output: `{
  "name": "utils.live",
  "tools": ${toolCount},
  "free": true
}`,
      inputSpeed: 25,
      highlight: "json",
      outputType: "text",
    },
    {
      toolName: "Base64 Encode",
      input: "Hello, developer!",
      output: "SGVsbG8sIGRldmVsb3BlciE=",
      inputSpeed: 45,
      highlight: "plain",
      outputType: "text",
    },
    {
      toolName: "QR Code Generator",
      input: "https://utils.live",
      output: "",
      inputSpeed: 35,
      highlight: "plain",
      outputType: "visual",
      visualOutput: <QRCodeDemo />,
    },
    {
      toolName: "Mermaid Diagram",
      input: "graph LR\n  A[Input] --> B[Process]\n  B --> C[Output]",
      output: "",
      inputSpeed: 25,
      highlight: "plain",
      outputType: "visual",
      visualOutput: <MermaidDemo />,
    },
    {
      toolName: "JWT Decoder",
      input:
        "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkRldiJ9",
      output: `Header:
{
  "alg": "HS256"
}

Payload:
{
  "sub": "1234567890",
  "name": "Dev"
}`,
      inputSpeed: 18,
      highlight: "json",
      outputType: "text",
    },
    {
      toolName: "SHA-256 Hash",
      input: "Hello, World!",
      output:
        "dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f",
      inputSpeed: 45,
      highlight: "plain",
      outputType: "text",
    },
    {
      toolName: "Hex to RGB",
      input: "#6366F1",
      output: `rgb(99, 102, 241)

Hue:        239°
Saturation: 84%
Lightness:  67%`,
      inputSpeed: 50,
      highlight: "plain",
      outputType: "text",
    },
    {
      toolName: "Case Converter",
      input: "getUserProfileData",
      output: `snake:  get_user_profile_data
kebab:  get-user-profile-data
title:  Get User Profile Data
const:  GET_USER_PROFILE_DATA`,
      inputSpeed: 30,
      highlight: "plain",
      outputType: "text",
    },
    {
      toolName: "Regex Tester",
      input: String.raw`/\b[A-Z][a-z]+\b/g`,
      output: `Test: "Hello World from Utils Live"

Matches found: 4
  [0] "Hello"   (index 0)
  [1] "World"   (index 6)
  [2] "Utils"   (index 17)
  [3] "Live"    (index 23)`,
      inputSpeed: 35,
      highlight: "plain",
      outputType: "text",
    },
    {
      toolName: "Unix Timestamp",
      input: "1738972800",
      output: `Date: 2025-02-08
Time: 00:00:00 UTC
ISO:  2025-02-08T00:00:00.000Z
Day:  Saturday`,
      inputSpeed: 50,
      highlight: "plain",
      outputType: "text",
    },
    {
      toolName: "URL Encode",
      input: "https://utils.live/tools?q=hello world&lang=en",
      output:
        "https%3A%2F%2Futils.live%2Ftools%3Fq%3Dhello%20world%26lang%3Den",
      inputSpeed: 25,
      highlight: "plain",
      outputType: "text",
    },
    {
      toolName: "UUID Generator",
      input: "v4",
      output: `550e8400-e29b-41d4-a716-446655440000

Version:  4 (random)
Variant:  RFC 4122`,
      inputSpeed: 60,
      highlight: "plain",
      outputType: "text",
    },
  ];
}

/** Simple JSON syntax highlighter */
function highlightJson(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex =
    /("(?:[^"\\]|\\.)*")\s*:|("(?:[^"\\]|\\.)*")|(\b\d+\.?\d*\b)|(\btrue\b|\bfalse\b)|(\bnull\b)|([[\]{}:,])/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      parts.push(
        <span key={i} className="text-sky-400 dark:text-sky-300">
          {match[1]}
        </span>
      );
      const rest = match[0].slice(match[1].length);
      if (rest.trim()) parts.push(rest);
    } else if (match[2]) {
      parts.push(
        <span key={i} className="text-emerald-600 dark:text-emerald-400">
          {match[2]}
        </span>
      );
    } else if (match[3]) {
      parts.push(
        <span key={i} className="text-amber-600 dark:text-amber-400">
          {match[3]}
        </span>
      );
    } else if (match[4]) {
      parts.push(
        <span key={i} className="text-violet-600 dark:text-violet-400">
          {match[4]}
        </span>
      );
    } else if (match[5]) {
      parts.push(
        <span key={i} className="text-red-500 dark:text-red-400">
          {match[5]}
        </span>
      );
    } else if (match[6]) {
      parts.push(
        <span key={i} className="text-muted-foreground">
          {match[6]}
        </span>
      );
    }

    lastIndex = match.index + match[0].length;
    i++;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function useTypewriter(
  text: string,
  speed: number = 30
): {
  displayed: string;
  isDone: boolean;
  start: () => void;
  reset: () => void;
} {
  const [displayed, setDisplayed] = useState("");
  const [isDone, setIsDone] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const textRef = useRef(text);
  const speedRef = useRef(speed);
  const prefersReducedMotion = usePrefersReducedMotion();

  textRef.current = text;
  speedRef.current = speed;

  const start = useCallback((): void => {
    setDisplayed("");
    setIsDone(false);
    setIsRunning(true);
  }, []);

  const reset = useCallback((): void => {
    setDisplayed("");
    setIsDone(false);
    setIsRunning(false);
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    // Respect prefers-reduced-motion: show the full string immediately
    // instead of running a 25-60ms-per-char setInterval animation.
    if (prefersReducedMotion) {
      setDisplayed(textRef.current);
      setIsDone(true);
      setIsRunning(false);
      return;
    }

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(textRef.current.slice(0, i));
      if (i >= textRef.current.length) {
        clearInterval(interval);
        setIsDone(true);
        setIsRunning(false);
      }
    }, speedRef.current);

    return () => clearInterval(interval);
  }, [isRunning, prefersReducedMotion]);

  return { displayed, isDone, start, reset };
}

function GlassPanel({
  label,
  content,
  isOutput,
  highlight,
  isVisual,
  children,
}: {
  label: string;
  content: string;
  isOutput?: boolean;
  highlight?: boolean;
  isVisual?: boolean;
  children?: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="border-border bg-card relative flex-1 overflow-hidden rounded-xl border shadow-sm">
      {/* Header bar */}
      <div className="bg-muted/50 text-muted-foreground px-4 py-2.5 text-[11px] font-medium tracking-wide uppercase">
        {label}
      </div>
      {/* Divider */}
      <div className="bg-border h-px" />
      {/* Content area */}
      <div className="h-[200px] overflow-auto p-4 font-mono text-sm leading-relaxed">
        {isVisual && children ? (
          <div className="flex h-full items-center justify-center p-4">
            {children}
          </div>
        ) : (
          <pre className="break-all whitespace-pre-wrap">
            {highlight ? highlightJson(content) : content}
            {!isOutput && (
              <span className="text-brand animate-pulse" aria-hidden="true">
                |
              </span>
            )}
          </pre>
        )}
      </div>
    </div>
  );
}

interface ToolDemoProps {
  toolCount: number;
  className?: string;
}

export function ToolDemo({
  toolCount,
  className,
}: ToolDemoProps): React.ReactElement {
  const t = useTranslations("home.toolDemo");
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [demoIndex, setDemoIndex] = useState(0);
  const [output, setOutput] = useState("");
  const [showVisual, setShowVisual] = useState(false);
  const startedRef = useRef(false);

  const demos = useMemo(() => getDemos(toolCount), [toolCount]);
  const demo = demos[demoIndex % demos.length]!;
  const typer = useTypewriter(demo.input, demo.inputSpeed);

  // Start typing when first scrolled into view
  useEffect(() => {
    if (isInView && !startedRef.current) {
      startedRef.current = true;
      typer.start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only trigger on isInView
  }, [isInView]);

  // Show output after typing completes
  useEffect(() => {
    if (typer.isDone && !output && !showVisual) {
      const timer = setTimeout(() => {
        if (demo.outputType === "visual") {
          setShowVisual(true);
        } else {
          setOutput(demo.output);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [typer.isDone, output, showVisual, demo.output, demo.outputType]);

  // Advance to next demo after showing output
  useEffect(() => {
    if (!output && !showVisual) return;

    const timer = setTimeout(() => {
      setOutput("");
      setShowVisual(false);
      typer.reset();
      setDemoIndex((prev) => prev + 1);
    }, 1800);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only trigger on output/showVisual change
  }, [output, showVisual]);

  // Start typing the new demo after index changes (skip first mount)
  useEffect(() => {
    if (demoIndex > 0) {
      const timer = setTimeout(() => typer.start(), 200);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only trigger on demoIndex
  }, [demoIndex]);

  const isJson = demo.highlight === "json";

  return (
    <section ref={ref} className={cn("py-12 sm:py-16", className)}>
      <div className="container max-w-4xl">
        <m.div
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
        >
          <h2 className="mb-3 text-center text-2xl font-bold sm:text-3xl">
            {t("heading")}
          </h2>
          <p className="text-muted-foreground mb-8 text-center text-lg">
            {t("subheading")}
          </p>

          {/* Tool name tab */}
          <div className="mb-4 flex items-center gap-2">
            <AnimatePresence mode="wait">
              <m.div
                key={demo.toolName}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="bg-brand/10 text-brand inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-medium"
              >
                {demo.toolName}
              </m.div>
            </AnimatePresence>
          </div>

          {/* Glass panels with glow backdrop */}
          <div className="relative">
            {/* Decorative glow — visible through translucent panels */}
            <div
              className="pointer-events-none absolute inset-0 -inset-x-8 -inset-y-4"
              style={{
                background:
                  "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(99,102,241,0.12) 0%, transparent 70%)",
              }}
            />
            <div className="relative flex flex-col items-stretch gap-3 sm:flex-row sm:gap-4">
              <GlassPanel
                label={t("inputLabel")}
                content={typer.displayed}
                highlight={isJson}
              />
              {/* Flow arrow */}
              <div className="hidden shrink-0 items-center sm:flex">
                <ArrowRight className="text-muted-foreground/30 h-5 w-5" />
              </div>
              <GlassPanel
                label={t("outputLabel")}
                content={output}
                isOutput
                highlight={isJson && output.length > 0}
                isVisual={demo.outputType === "visual" && showVisual}
              >
                {demo.visualOutput}
              </GlassPanel>
            </div>
          </div>
        </m.div>
      </div>
    </section>
  );
}
