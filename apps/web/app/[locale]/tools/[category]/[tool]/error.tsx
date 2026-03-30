"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ToolError({
  error,
  reset,
}: ErrorProps): React.ReactElement {
  useEffect(() => {
    console.error("Tool page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
      <div className="bg-destructive/10 flex h-16 w-16 items-center justify-center rounded-full">
        <AlertTriangle className="text-destructive h-8 w-8" />
      </div>
      <div>
        <h1 className="mb-2 text-xl font-bold">Tool Error</h1>
        <p className="text-muted-foreground max-w-md">
          This tool encountered an error. Try again or go back to browse other
          tools.
        </p>
      </div>
      {process.env.NODE_ENV === "development" && error.message && (
        <div className="bg-muted max-w-lg overflow-auto rounded-lg p-4 text-left">
          <code className="text-destructive text-sm">{error.message}</code>
        </div>
      )}
      <div className="flex gap-3">
        <Button onClick={reset}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
        <Button variant="outline" asChild>
          <Link href="/tools">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All Tools
          </Link>
        </Button>
      </div>
    </div>
  );
}
