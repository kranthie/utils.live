"use client";

import { memo, useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Terminal } from "lucide-react";
import type { ToolTierValue } from "@utils-live/tools/constants";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/shared/copy-button";
import { cn } from "@/lib/utils";

interface OptionSchema {
  name: string;
  type: string;
  required: boolean;
  default?: unknown;
  description: string;
}

interface ToolApiUsageProps {
  /**
   * Tool ID for package usage
   */
  toolId: string;
  /**
   * Tool tier
   */
  tier: ToolTierValue;
  /**
   * Tool options schema
   */
  options?: OptionSchema[];
  /**
   * Example input for code snippets
   */
  exampleInput?: string;
  /**
   * Example options for code snippets
   */
  exampleOptions?: Record<string, unknown>;
  /**
   * Whether the section is expanded by default
   * @default false
   */
  defaultExpanded?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

type LanguageKey = "javascript" | "typescript";

export const ToolApiUsage = memo(function ToolApiUsage({
  toolId,
  tier,
  options = [],
  exampleInput = "Your input here",
  exampleOptions = {},
  defaultExpanded = false,
  className,
}: ToolApiUsageProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [language, setLanguage] = useState<LanguageKey>("javascript");

  const hasOptions = Object.keys(exampleOptions).length > 0;

  // Generate code snippets for npm package usage
  const codeSnippets = useMemo(() => {
    const optionsStr = hasOptions
      ? `, ${JSON.stringify(exampleOptions, null, 2)
          .split("\n")
          .map((line, i) => (i === 0 ? line : "  " + line))
          .join("\n")}`
      : "";

    return {
      javascript: `import { getToolById, executeTool } from "@utils-live/tools";

const tool = getToolById("${toolId}");
const result = await executeTool(tool, { input: ${JSON.stringify(exampleInput)} }${optionsStr});

if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}`,

      typescript: `import { getToolById, executeTool } from "@utils-live/tools";

const tool = getToolById("${toolId}")!;
const result = await executeTool(tool, { input: ${JSON.stringify(exampleInput)} }${optionsStr});

if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}`,
    };
  }, [toolId, exampleInput, exampleOptions, hasOptions]);

  const tierLabel =
    tier === "client"
      ? "Runs entirely in the browser"
      : tier === "server-light"
        ? "Lightweight server processing"
        : tier === "server-heavy"
          ? "Heavy server processing"
          : "AI-powered processing";

  return (
    <div className={cn("rounded-lg border", className)}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <button className="hover:bg-muted/50 flex w-full items-center justify-between p-4 transition-colors">
            <div className="flex items-center gap-2">
              <Terminal className="text-muted-foreground h-4 w-4" />
              <span className="font-medium">Programmatic Usage</span>
              <Badge variant="outline" className="text-xs">
                npm
              </Badge>
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
            {/* Install */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Install</label>
              <div className="relative">
                <pre className="bg-muted overflow-auto rounded-md p-4 font-mono text-sm">
                  npm install @utils-live/tools
                </pre>
                <div className="absolute top-2 right-2">
                  <CopyButton value="npm install @utils-live/tools" size="sm" />
                </div>
              </div>
            </div>

            {/* Tier info */}
            <div className="bg-muted/50 rounded-md p-3 text-sm">
              <p className="text-muted-foreground">
                <strong>Execution tier:</strong> {tierLabel}.{" "}
                {tier === "client"
                  ? "This tool runs synchronously with no network calls."
                  : "This tool requires a server environment to execute."}
              </p>
            </div>

            {/* Options reference */}
            {options.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Options</label>
                <div className="overflow-hidden rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">
                          Name
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Type
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Required
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Default
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {options.map((option) => (
                        <tr key={option.name} className="border-t">
                          <td className="px-3 py-2 font-mono text-xs">
                            {option.name}
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant="outline" className="text-xs">
                              {option.type}
                            </Badge>
                          </td>
                          <td className="px-3 py-2">
                            {option.required ? "Yes" : "No"}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs">
                            {option.default !== undefined
                              ? JSON.stringify(option.default)
                              : "-"}
                          </td>
                          <td className="text-muted-foreground px-3 py-2">
                            {option.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Code snippets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Example</label>
                <Select
                  value={language}
                  onValueChange={(v) => setLanguage(v as LanguageKey)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="typescript">TypeScript</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative">
                <pre className="bg-muted max-h-80 overflow-auto rounded-md p-4 font-mono text-sm">
                  {codeSnippets[language]}
                </pre>
                <div className="absolute top-2 right-2">
                  <CopyButton value={codeSnippets[language]} size="sm" />
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
});
