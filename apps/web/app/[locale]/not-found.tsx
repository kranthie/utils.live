"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, Search, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

// Popular tools to suggest (paths match actual tool routes)
const POPULAR_TOOLS = [
  {
    name: "JSON Formatter",
    description: "Format and prettify JSON data",
    href: "/tools/json/formatter",
  },
  {
    name: "Base64 Encode",
    description: "Encode text to Base64 format",
    href: "/tools/encoding/base64-encode",
  },
  {
    name: "YAML to JSON",
    description: "Convert YAML to JSON format",
    href: "/tools/yaml/yaml-to-json",
  },
  {
    name: "Case Converter",
    description: "Convert text between different cases",
    href: "/tools/text/case-converter",
  },
];

export default function NotFoundPage(): React.ReactElement {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main id="main-content" className="flex flex-1 flex-col">
        <div className="container flex flex-1 flex-col items-center justify-center py-16 text-center">
          {/* Error Code */}
          <div
            className="from-primary/20 to-primary/5 mb-8 bg-gradient-to-b bg-clip-text text-[150px] leading-none font-bold text-transparent sm:text-[200px]"
            aria-hidden="true"
          >
            404
          </div>

          {/* Error Message */}
          <h1 className="mb-4 text-2xl font-bold sm:text-3xl">
            Page Not Found
          </h1>
          <p className="text-muted-foreground mb-8 max-w-md text-lg">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It
            might have been moved or doesn&apos;t exist.
          </p>

          {/* Action Buttons */}
          <div className="mb-12 flex flex-wrap items-center justify-center gap-4">
            <Button asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/tools">
                <Search className="mr-2 h-4 w-4" />
                Browse Tools
              </Link>
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                if (
                  typeof document !== "undefined" &&
                  document.referrer &&
                  new URL(document.referrer).origin === window.location.origin
                ) {
                  router.back();
                } else {
                  router.push("/");
                }
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>

          {/* Popular Tools */}
          <div className="w-full max-w-2xl">
            <div className="mb-4 flex items-center justify-center gap-2">
              <Sparkles className="text-primary h-5 w-5" />
              <h2 className="text-lg font-semibold">Popular Tools</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {POPULAR_TOOLS.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="hover:bg-muted/50 group flex flex-col rounded-lg border p-4 text-left transition-colors"
                >
                  <span className="group-hover:text-primary font-medium">
                    {tool.name}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {tool.description}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
