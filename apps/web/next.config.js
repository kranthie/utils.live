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

module.exports = nextConfig;
