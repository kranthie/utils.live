"use client";

import { memo, useState } from "react";
import dynamic from "next/dynamic";
import {
  ChevronDown,
  ChevronUp,
  Book,
  Code,
  Lightbulb,
  Info,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
// Documentation sits below the fold. Lazy-load MarkdownPreview (which pulls
// in rehype-highlight + highlight.js, ~90 KB gzipped) so it only loads when
// the user expands the documentation section on a tool page.
const MarkdownPreview = dynamic(
  () =>
    import("@/components/renderers/markdown-preview").then(
      (mod) => mod.MarkdownPreview
    ),
  { ssr: false }
);
import { CodeEditor } from "@/components/editor/code-editor";
import { CopyButton } from "@/components/shared/copy-button";
import { cn } from "@/lib/utils";

interface Example {
  title: string;
  description?: string;
  input: string | Record<string, unknown>;
  output: string;
  options?: Record<string, unknown>;
}

interface ToolDocumentationProps {
  /**
   * Tool name
   */
  name: string;
  /**
   * Short description
   */
  description: string;
  /**
   * Long description (markdown)
   */
  longDescription?: string;
  /**
   * Usage examples
   */
  examples?: Example[];
  /**
   * Related tool IDs
   */
  relatedTools?: string[];
  /**
   * Tool category
   */
  category: string;
  /**
   * Whether the documentation is expanded by default
   * @default true
   */
  defaultExpanded?: boolean;
  /**
   * Callback when an example is loaded
   */
  onLoadExample?: (example: Example) => void;
  /**
   * Language for input syntax highlighting in examples
   */
  inputLanguage?: string;
  /**
   * Language for output syntax highlighting in examples
   */
  outputLanguage?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

// Known option keys that represent input/output languages
const INPUT_LANG_KEYS = ["from", "language", "inputLanguage", "sourceLanguage"];
const OUTPUT_LANG_KEYS = ["to", "outputLanguage", "targetLanguage"];

function getExampleLanguage(
  example: Example,
  keys: string[],
  fallback: string | undefined
): string {
  if (example.options) {
    for (const key of keys) {
      const val = example.options[key];
      if (typeof val === "string" && val !== "auto") return val;
    }
  }
  return fallback ?? "plaintext";
}

export const ToolDocumentation = memo(function ToolDocumentation({
  name: _name,
  description,
  longDescription,
  examples = [],
  relatedTools: _relatedTools,
  category,
  defaultExpanded = true,
  onLoadExample,
  inputLanguage,
  outputLanguage,
  className,
}: ToolDocumentationProps): React.ReactElement {
  const t = useTranslations("tools.documentation");
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={cn("rounded-lg border", className)}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <button className="hover:bg-muted/50 flex w-full items-center justify-between p-4 transition-colors">
            <div className="flex items-center gap-2">
              <Book className="text-muted-foreground h-4 w-4" />
              <span className="font-medium">{t("title")}</span>
            </div>
            {isExpanded ? (
              <ChevronUp className="text-muted-foreground h-4 w-4" />
            ) : (
              <ChevronDown className="text-muted-foreground h-4 w-4" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-6 border-t p-4">
            {/* Overview */}
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-medium">
                <Info className="h-4 w-4" />
                {t("overview")}
              </h3>
              <p className="text-muted-foreground text-sm">{description}</p>
              {longDescription && (
                <div className="mt-4">
                  <MarkdownPreview content={longDescription} />
                </div>
              )}
            </div>

            {/* Tool Info */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t("category")} </span>
                <Badge variant="outline">{category}</Badge>
              </div>
            </div>

            {/* Privacy info */}
            <div className="bg-muted/50 rounded-md p-3 text-sm">
              <div className="flex items-start gap-2">
                <Lightbulb className="text-muted-foreground mt-0.5 h-4 w-4" />
                <p className="text-muted-foreground">{t("privacyNote")}</p>
              </div>
            </div>

            {/* Examples */}
            {examples.length > 0 && (
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-medium">
                  <Code className="h-4 w-4" />
                  {t("examples")}
                </h3>
                <Tabs defaultValue="0">
                  <TabsList>
                    {examples.map((example, i) => (
                      <TabsTrigger key={i} value={i.toString()}>
                        {example.title}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {examples.map((example, i) => (
                    <TabsContent
                      key={i}
                      value={i.toString()}
                      className="space-y-4"
                    >
                      {example.description && (
                        <p className="text-muted-foreground text-sm">
                          {example.description}
                        </p>
                      )}
                      <div className="grid gap-4 md:grid-cols-2">
                        {/* Input */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-muted-foreground text-xs font-medium">
                              {t("input")}
                            </label>
                            <CopyButton
                              value={
                                typeof example.input === "string"
                                  ? example.input
                                  : JSON.stringify(example.input, null, 2)
                              }
                              size="sm"
                            />
                          </div>
                          <div className="h-36 overflow-hidden rounded-md border">
                            <CodeEditor
                              value={
                                typeof example.input === "string"
                                  ? example.input
                                  : JSON.stringify(example.input, null, 2)
                              }
                              language={getExampleLanguage(
                                example,
                                INPUT_LANG_KEYS,
                                inputLanguage
                              )}
                              readOnly
                              lineNumbers={false}
                              minimap={false}
                              minHeight="144px"
                              className="h-36"
                            />
                          </div>
                        </div>
                        {/* Output */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-muted-foreground text-xs font-medium">
                              {t("output")}
                            </label>
                            <CopyButton value={example.output} size="sm" />
                          </div>
                          <div className="h-36 overflow-hidden rounded-md border">
                            <CodeEditor
                              value={example.output}
                              language={getExampleLanguage(
                                example,
                                OUTPUT_LANG_KEYS,
                                outputLanguage ?? inputLanguage
                              )}
                              readOnly
                              lineNumbers={false}
                              minimap={false}
                              minHeight="144px"
                              className="h-36"
                            />
                          </div>
                        </div>
                      </div>
                      {example.options &&
                        Object.keys(example.options).length > 0 && (
                          <div className="space-y-2">
                            <label className="text-muted-foreground text-xs font-medium">
                              {t("options")}
                            </label>
                            <div className="h-24 overflow-hidden rounded-md border">
                              <CodeEditor
                                value={JSON.stringify(example.options, null, 2)}
                                language="json"
                                readOnly
                                lineNumbers={false}
                                minimap={false}
                              />
                            </div>
                          </div>
                        )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onLoadExample?.(example)}
                      >
                        {t("loadExample")}
                      </Button>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
});
