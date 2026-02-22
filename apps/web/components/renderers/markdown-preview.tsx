"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { CopyButton } from "@/components/shared/copy-button";
import { cn } from "@/lib/utils";
import "highlight.js/styles/github-dark.css";

interface MarkdownPreviewProps {
  /**
   * Markdown content to render
   */
  content: string;
  /**
   * Whether to show a copy button for code blocks
   * @default true
   */
  showCodeCopy?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function MarkdownPreview({
  content,
  showCodeCopy = true,
  className,
}: MarkdownPreviewProps): React.ReactElement {
  return (
    <div
      className={cn(
        // Base typography — default (16px) size for readability, full-width
        "prose dark:prose-invert max-w-none",
        // Headings — theme foreground, semibold, scroll offset for sticky header
        "prose-headings:text-foreground prose-headings:font-semibold prose-headings:scroll-mt-20",
        // Body text — relaxed line-height for comfortable reading
        "prose-p:leading-relaxed",
        // Links — theme primary, underline only on hover
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium",
        // Inline code — remove backtick pseudo-elements, theme muted background
        "prose-code:before:content-none prose-code:after:content-none",
        "prose-code:bg-muted prose-code:rounded-md prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.875em] prose-code:font-normal",
        // Code blocks — theme muted background with subtle border
        "prose-pre:bg-muted prose-pre:rounded-lg prose-pre:border prose-pre:border-border",
        // Blockquotes — theme border, not italic (reads better for AI output)
        "prose-blockquote:border-border prose-blockquote:not-italic prose-blockquote:font-normal",
        // Tables — theme borders
        "prose-th:border-border prose-td:border-border",
        // HR — theme border, tighter spacing
        "prose-hr:border-border prose-hr:my-4",
        // Images
        "prose-img:rounded-lg",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          pre: ({ children, ...props }): React.ReactElement => {
            // Extract code content for the copy button
            const codeElement = children as React.ReactElement<{
              children?: unknown;
            }>;
            const codeContent =
              typeof codeElement?.props?.children === "string"
                ? codeElement.props.children
                : "";

            return (
              <div className="group relative">
                {showCodeCopy && codeContent && (
                  <div className="absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
                    <CopyButton value={codeContent} size="sm" />
                  </div>
                )}
                <pre {...props} className="overflow-auto p-4">
                  {children}
                </pre>
              </div>
            );
          },
          a: ({ children, href, ...props }): React.ReactElement => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
