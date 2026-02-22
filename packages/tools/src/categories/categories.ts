import type { Category } from "../types";

/**
 * All 34 tool categories for the utils.live platform.
 * Categories are ordered by popularity/usage (most-used first).
 */
export const CATEGORIES: readonly Category[] = [
  {
    id: "json",
    name: "JSON Tools",
    description:
      "Free online JSON tools to format, validate, compare, and transform JSON data. Pretty print, minify, convert to YAML/CSV/XML, and more — all in your browser.",
    icon: "Braces",
    order: 1,
    slug: "json",
    group: "Data Formats",
  },
  {
    id: "encoding",
    name: "Encoding & Decoding",
    description:
      "Free online encoding and decoding tools for Base64, URL encoding, Unicode, HTML entities, and more. Convert between formats instantly in your browser.",
    icon: "Binary",
    order: 2,
    slug: "encoding",
    group: "Encoding & Security",
  },
  {
    id: "text",
    name: "Text Tools",
    description:
      "Free online text tools to transform, analyze, and manipulate text strings. Count words, change case, find and replace, sort lines, and more.",
    icon: "Type",
    order: 3,
    slug: "text",
    group: "Utility",
  },
  {
    id: "crypto",
    name: "Cryptography",
    description:
      "Free online cryptography tools for hash generation, encryption, decryption, and security analysis. MD5, SHA-256, AES, HMAC, and more — all client-side.",
    icon: "Lock",
    order: 4,
    slug: "crypto",
    group: "Encoding & Security",
  },
  {
    id: "jwt",
    name: "JWT & Tokens",
    description:
      "Free online JWT tools to decode, verify, and debug JSON Web Tokens. Inspect headers, payloads, and signatures without sending data to any server.",
    icon: "Key",
    order: 5,
    slug: "jwt",
    group: "Developer Tools",
  },
  {
    id: "regex",
    name: "Regular Expressions",
    description:
      "Free online regular expression tools to build, test, and debug regex patterns. Live matching, syntax highlighting, and cheat sheets for all major flavors.",
    icon: "Regex",
    order: 6,
    slug: "regex",
    group: "Developer Tools",
  },
  {
    id: "color",
    name: "Color Tools",
    description:
      "Free online color tools to convert, pick, and generate color palettes. HEX, RGB, HSL, OKLCH conversions, contrast checkers, and palette generators.",
    icon: "Pipette",
    order: 7,
    slug: "color",
    group: "Visual & Media",
  },
  {
    id: "datetime",
    name: "Date & Time",
    description:
      "Free online date and time tools to convert, format, and calculate dates. Unix timestamps, time zones, duration calculators, and date formatters.",
    icon: "Clock",
    order: 8,
    slug: "datetime",
    group: "Utility",
  },
  {
    id: "identifiers",
    name: "Identifiers & IDs",
    description:
      "Free online ID generators for UUIDs, CUIDs, NanoIDs, ULIDs, and more. Generate unique identifiers instantly — no server needed, all in your browser.",
    icon: "Fingerprint",
    order: 9,
    slug: "identifiers",
    group: "Developer Tools",
  },
  {
    id: "diagram",
    name: "Diagrams & Visual",
    description:
      "Free online diagram tools to generate and render flowcharts, sequence diagrams, and charts. Mermaid, PlantUML, and more — visualize directly in your browser.",
    icon: "GitBranch",
    order: 10,
    slug: "diagram",
    group: "Visual & Media",
  },
  {
    id: "html",
    name: "HTML Tools",
    description:
      "Free online HTML tools to parse, format, minify, and convert HTML. Pretty print, strip tags, encode entities, and convert to Markdown or JSX.",
    icon: "Globe",
    order: 11,
    slug: "html",
    group: "Data Formats",
  },
  {
    id: "css",
    name: "CSS Tools",
    description:
      "Free online CSS tools to format, minify, and optimize stylesheets. Beautify CSS, convert units, generate gradients, and clean up your styles.",
    icon: "Palette",
    order: 12,
    slug: "css",
    group: "Data Formats",
  },
  {
    id: "code",
    name: "Code Formatting",
    description:
      "Free online code formatting tools to beautify and format code in JavaScript, TypeScript, Python, SQL, and more. Consistent formatting in your browser.",
    icon: "FileCode",
    order: 13,
    slug: "code",
    group: "Developer Tools",
  },
  {
    id: "yaml",
    name: "YAML Tools",
    description:
      "Free online YAML tools to format, validate, and convert YAML files. Pretty print, convert to JSON/TOML, and check syntax — all client-side.",
    icon: "FileCode2",
    order: 14,
    slug: "yaml",
    group: "Data Formats",
  },
  {
    id: "xml",
    name: "XML Tools",
    description:
      "Free online XML tools to parse, format, and transform XML documents. Pretty print, minify, validate, and convert to JSON — all in your browser.",
    icon: "Code2",
    order: 15,
    slug: "xml",
    group: "Data Formats",
  },
  {
    id: "csv",
    name: "CSV & TSV Tools",
    description:
      "Free online CSV and TSV tools to parse, convert, and manipulate tabular data. Convert to JSON/XML, sort columns, and filter rows in your browser.",
    icon: "Table",
    order: 16,
    slug: "csv",
    group: "Data Formats",
  },
  {
    id: "markdown",
    name: "Markdown Tools",
    description:
      "Free online Markdown tools to preview, convert, and enhance Markdown documents. Live preview, convert to HTML, generate tables, and format text.",
    icon: "FileText",
    order: 17,
    slug: "markdown",
    group: "Data Formats",
  },
  {
    id: "math",
    name: "Numbers & Math",
    description:
      "Free online math and number tools for calculations, conversions, and number formatting. Base conversion, percentage calculator, unit converter, and more.",
    icon: "Calculator",
    order: 18,
    slug: "math",
    group: "Utility",
  },
  {
    id: "image",
    name: "Image Tools",
    description:
      "Free online image tools to convert, resize, and optimize images. Change formats, compress files, crop, and adjust — all processed locally in your browser.",
    icon: "Image",
    order: 19,
    slug: "image",
    group: "Visual & Media",
  },
  {
    id: "svg",
    name: "SVG Tools",
    description:
      "Free online SVG tools to optimize, convert, and manipulate SVG files. Minify, prettify, convert to PNG/JSX, and clean up SVG code in your browser.",
    icon: "Shapes",
    order: 20,
    slug: "svg",
    group: "Visual & Media",
  },
  {
    id: "web",
    name: "Web & SEO",
    description:
      "Free online web and SEO tools for URL parsing, meta tag generation, Open Graph previews, and web utilities. Analyze and optimize your web presence.",
    icon: "Globe2",
    order: 21,
    slug: "web",
    group: "Network & Web",
  },
  {
    id: "api",
    name: "API & OpenAPI",
    description:
      "Free online API and OpenAPI tools for schema validation, mock data generation, and API testing utilities. Work with REST APIs directly in your browser.",
    icon: "Cloud",
    order: 22,
    slug: "api",
    group: "Developer Tools",
  },
  {
    id: "sql",
    name: "SQL & Database",
    description:
      "Free online SQL and database tools to format, validate, and convert SQL queries. Pretty print, minify, and convert between SQL dialects.",
    icon: "Database",
    order: 23,
    slug: "sql",
    group: "Developer Tools",
  },
  {
    id: "network",
    name: "Network Tools",
    description:
      "Free online network tools for DNS lookup, IP address utilities, and connectivity diagnostics. Analyze network data and convert formats client-side.",
    icon: "Network",
    order: 24,
    slug: "network",
    group: "Network & Web",
  },
  {
    id: "validation",
    name: "Validation Tools",
    description:
      "Free online validation tools to check formats, data structures, and syntax. Validate JSON, YAML, XML, emails, URLs, and more — instantly in your browser.",
    icon: "CheckCircle",
    order: 25,
    slug: "validation",
    group: "Encoding & Security",
  },
  {
    id: "data",
    name: "Data Formats",
    description:
      "Free online data format tools to convert and view INI, NDJSON, HJSON, Avro, Protobuf, MessagePack, and other data serialization formats.",
    icon: "Database",
    order: 26,
    slug: "data",
    group: "Data Formats",
  },
  {
    id: "toml",
    name: "TOML Tools",
    description:
      "Free online TOML tools to format, validate, and convert TOML configuration files. Pretty print, convert to JSON/YAML, and check syntax instantly.",
    icon: "FileCode2",
    order: 27,
    slug: "toml",
    group: "Data Formats",
  },
  {
    id: "git",
    name: "Git & Version Control",
    description:
      "Free online Git and version control tools for branch naming, commit message formatting, .gitignore generation, and Git command reference.",
    icon: "GitBranch",
    order: 28,
    slug: "git",
    group: "Developer Tools",
  },
  {
    id: "devops",
    name: "DevOps & Infrastructure",
    description:
      "Free online DevOps tools for Docker, Kubernetes, Helm, and container configuration. Generate Dockerfiles, validate K8s manifests, and more.",
    icon: "Container",
    order: 29,
    slug: "devops",
    group: "Developer Tools",
  },
  {
    id: "feeds",
    name: "Feeds & Structured Data",
    description:
      "Free online feed and structured data tools for RSS, Atom, JSON Feed, and Schema.org. Generate, validate, and convert web feeds in your browser.",
    icon: "Rss",
    order: 30,
    slug: "feeds",
    group: "Network & Web",
  },
  {
    id: "communication",
    name: "Communication",
    description:
      "Free online communication tools for email formatting, messaging templates, and communication format conversion. Generate and validate email content.",
    icon: "Mail",
    order: 31,
    slug: "communication",
    group: "Network & Web",
  },
  {
    id: "misc",
    name: "Miscellaneous",
    description:
      "Free online miscellaneous developer tools for QR codes, UUIDs, Lorem Ipsum text, and other handy utilities. Quick tools that run in your browser.",
    icon: "Box",
    order: 32,
    slug: "misc",
    group: "Utility",
  },
  {
    id: "legal",
    name: "Legal & Compliance",
    description:
      "Free online legal document generators for privacy policies, terms of service, GDPR statements, and compliance documents. Generate legal text instantly.",
    icon: "Scale",
    order: 33,
    slug: "legal",
    group: "Utility",
  },
  {
    id: "reference",
    name: "Reference & Lookup",
    description:
      "Free online reference and lookup tools for country codes, currency codes, language codes, MIME types, and other developer reference tables.",
    icon: "BookOpen",
    order: 34,
    slug: "reference",
    group: "Utility",
  },
] as const;

/**
 * Map of category IDs to Category objects for quick lookup.
 */
const categoryMap = new Map<string, Category>(
  CATEGORIES.map((cat) => [cat.id, cat])
);

/**
 * Get a category by its ID.
 *
 * @param id - Category ID
 * @returns Category if found, undefined otherwise
 */
export function getCategoryById(id: string): Category | undefined {
  return categoryMap.get(id);
}

/**
 * Get all categories sorted by order.
 *
 * @returns All categories
 */
export function getAllCategories(): readonly Category[] {
  return CATEGORIES;
}
