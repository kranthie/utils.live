import { describe, it, expect } from "vitest";
import { locales } from "../../i18n/config";
import { getAllTools, getAllCategories } from "@utils-live/tools";

// Cloudflare Pages free plan caps a single deployment at 20,000 pages.
// generateStaticParams emits (locales × (tools + categories + static + blog))
// so re-enabling locales without checking this silently breaks deploys.
// Keep a comfortable headroom below the ceiling.
const PAGE_BUDGET_CEILING = 19500;
const STATIC_PAGES_PER_LOCALE = 10; // home, about, contact, privacy, tools, etc.

describe("Cloudflare Pages page-budget guard", () => {
  it("total generated static pages stays under the 20k ceiling", () => {
    const toolCount = getAllTools().length;
    const categoryCount = getAllCategories().length;
    const estimated =
      locales.length * (toolCount + categoryCount + STATIC_PAGES_PER_LOCALE);

    expect({ locales: locales.length, estimated }).toMatchObject({
      locales: locales.length,
    });
    expect(estimated).toBeLessThan(PAGE_BUDGET_CEILING);
  });
});
