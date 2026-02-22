/**
 * Generates search data from the tool registry.
 * This replaces the hardcoded tool list in global-search.tsx.
 */

import { getAllTools, getAllCategories } from "@utils-live/tools";

interface SearchTool {
  id: string;
  name: string;
  description: string;
  category: string;
  keywords: string[];
  icon: string;
}

interface SearchCategory {
  id: string;
  name: string;
  icon: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  json: "{ }",
  yaml: "\u{1F4C4}",
  xml: "\u{1F3F7}\uFE0F",
  csv: "\u{1F4CA}",
  toml: "\u2699\uFE0F",
  data: "\u{1F4E6}",
  encoding: "\u{1F524}",
  text: "\u{1F4C3}",
  markdown: "\u{1F4DD}",
  html: "\u{1F310}",
  css: "\u{1F3A8}",
  code: "\u{1F4BB}",
  crypto: "\u{1F510}",
  jwt: "\u{1F511}",
  regex: "\u{1F50D}",
  datetime: "\u{1F4C5}",
  math: "\u{1F522}",
  color: "\u{1F3A8}",
  diagram: "\u{1F4C8}",
  image: "\u{1F5BC}\uFE0F",
  svg: "\u{1F4D0}",
  web: "\u{1F30D}",
  api: "\u2601\uFE0F",
  sql: "\u{1F5C3}\uFE0F",
  network: "\u{1F4E1}",
  misc: "\u{1F527}",
};

function getCategoryIcon(categoryId: string): string {
  return CATEGORY_ICONS[categoryId] ?? "\u{1F527}";
}

let cachedTools: SearchTool[] | null = null;
let cachedCategories: SearchCategory[] | null = null;

export function getSearchTools(): SearchTool[] {
  if (cachedTools) return cachedTools;

  cachedTools = getAllTools().map((tool) => ({
    id: tool.meta.id,
    name: tool.meta.name,
    description: tool.meta.description,
    category: tool.meta.category,
    keywords: tool.meta.keywords,
    icon: tool.meta.icon ?? getCategoryIcon(tool.meta.category),
  }));

  return cachedTools;
}

export function getSearchCategories(): SearchCategory[] {
  if (cachedCategories) return cachedCategories;

  const categories = getAllCategories();
  // Only include categories that have registered tools
  const toolCategories = new Set(getAllTools().map((t) => t.meta.category));

  cachedCategories = categories
    .filter((cat) => toolCategories.has(cat.id))
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      icon: getCategoryIcon(cat.id),
    }));

  return cachedCategories;
}
