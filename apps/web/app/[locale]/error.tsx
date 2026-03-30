"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({
  error,
  reset,
}: ErrorPageProps): React.ReactElement {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main id="main-content" className="flex flex-1 flex-col">
        <div className="container flex flex-1 flex-col items-center justify-center py-16 text-center">
          {/* Error Icon */}
          <div className="bg-destructive/10 mb-8 flex h-24 w-24 items-center justify-center rounded-full">
            <AlertTriangle className="text-destructive h-12 w-12" />
          </div>

          {/* Error Message */}
          <h1 className="mb-4 text-2xl font-bold sm:text-3xl">
            Something went wrong
          </h1>
          <p className="text-muted-foreground mb-2 max-w-md text-lg">
            An unexpected error occurred. We&apos;ve been notified and are
            looking into it.
          </p>

          {/* Error Details (in development) */}
          {process.env.NODE_ENV === "development" && error.message && (
            <div className="bg-muted mt-4 mb-6 max-w-lg overflow-auto rounded-lg p-4 text-left">
              <code className="text-destructive text-sm">{error.message}</code>
              {error.digest && (
                <p className="text-muted-foreground mt-2 text-xs">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mb-12 flex flex-wrap items-center justify-center gap-4">
            <Button onClick={reset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/contact">
                <Bug className="mr-2 h-4 w-4" />
                Contact Support
              </Link>
            </Button>
          </div>

          {/* Help Text */}
          <div className="bg-muted/30 max-w-md rounded-lg p-6">
            <h2 className="mb-2 font-semibold">What can you do?</h2>
            <ul className="text-muted-foreground list-disc space-y-2 pl-5 text-left text-sm">
              <li>Try refreshing the page</li>
              <li>Clear your browser cache</li>
              <li>Check your internet connection</li>
              <li>
                <Link href="/contact" className="text-primary hover:underline">
                  Contact us
                </Link>{" "}
                if the problem persists
              </li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
