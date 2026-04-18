const path = require("path");
const createNextIntlPlugin = require("next-intl/plugin");
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  poweredByHeader: false,
  transpilePackages: ["@utils-live/tools"],
  images: {
    unoptimized: true,
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  // next-intl requires this alias so Turbopack can resolve the config file.
  // Next.js 16 uses `turbopack` (top-level) rather than `experimental.turbo`.
  // The next-intl plugin detects Turbopack via TURBOPACK env var which is not
  // set by Next.js 16 by default, so we wire the alias manually.
  // `root` pins the workspace root so Turbopack doesn't walk up into a parent
  // worktree's pnpm-workspace.yaml (happens when this repo is checked out
  // under `.claude/worktrees/*`).
  turbopack: {
    root: path.resolve(__dirname, "../.."),
    resolveAlias: {
      "next-intl/config": "./i18n/request.ts",
    },
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "chart.js",
      "highlight.js",
      "react-markdown",
      "mermaid",
      "framer-motion",
    ],
  },
};

module.exports = withNextIntl(nextConfig);
